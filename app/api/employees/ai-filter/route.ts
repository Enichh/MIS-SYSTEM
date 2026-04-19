import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { searchEmployeesByEmbedding } from '@/lib/utils/embeddings';
import type { Employee, ApiResponse } from '@/types';

const SkillFilterSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  department: z.string().optional(),
  role: z.string().optional(),
});

const MAX_AI_CONTEXT_ITEMS = 50; // Reduced from 100 - top 50 semantic matches is sufficient
const MAX_TOKENS = 2000;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const LONGCAT_API_KEY = process.env.LONGCAT_API_KEY;

  if (!LONGCAT_API_KEY) {
    const errorResponse: ApiResponse = {
      code: 'MISSING_API_KEY',
      message: 'LONGCAT_API_KEY environment variable is not configured',
    };
    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const body = await request.json();
    const validatedData = SkillFilterSchema.parse(body);
    const requestStartTime = Date.now();

    // Apply pre-filtering using database filters to reduce dataset size
    const supabase = await createClient();
    let query = supabase.from('employees').select('*');
    
    if (validatedData.department) query = query.eq('department', validatedData.department);
    if (validatedData.role) query = query.eq('role', validatedData.role);

    // SEMANTIC SEARCH: Use vector similarity instead of random sampling
    let matchedIds: string[] = [];
    let wasSampled = false;
    let datasetSize = 0;
    let aiContextSize = 0;
    let embeddingTime = 0;
    let searchTime = 0;

    try {
      // First, get total count for metadata
      const { count, error: countError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      datasetSize = count || 0;

      // Perform semantic search using BGE embeddings (hybrid: vector + keyword)
      console.log(`AI Filter: Starting semantic search for query: "${validatedData.query}"`);
      const searchStartTime = Date.now();
      
      const semanticMatches = await searchEmployeesByEmbedding(validatedData.query, {
        matchCount: MAX_AI_CONTEXT_ITEMS,
        useHybrid: true, // Enable keyword + vector hybrid search
      });

      searchTime = Date.now() - searchStartTime;
      matchedIds = semanticMatches.map(m => m.id);
      aiContextSize = matchedIds.length;
      
      console.log(`AI Filter: Semantic search completed in ${(searchTime / 1000).toFixed(2)}s - Found ${aiContextSize} relevant employees`);
      
      // Note: With hybrid search (vector + keyword), we rarely get <10 results
      // If we do, it means the query truly has no matches
      if (aiContextSize === 0) {
        console.log('AI Filter: No semantic matches found, query may have no valid matches');
      }
    } catch (semanticError) {
      console.error('Semantic search failed, falling back to random sampling:', semanticError);
      
      // FALLBACK: Fetch all filtered employees and use random sampling
      // This happens if embedding service is down or query fails
      const { data: allFilteredEmployees, error: fetchError } = await query;
      
      if (fetchError) throw new Error(`Database fetch failed: ${fetchError.message}`);
      
      datasetSize = allFilteredEmployees?.length || 0;
      wasSampled = datasetSize > MAX_AI_CONTEXT_ITEMS;
      
      let preFilteredEmployees = allFilteredEmployees || [];
      
      if (wasSampled) {
        console.warn(`Large dataset detected (${datasetSize} items). Using random sampling as fallback.`);
        const shuffled = [...preFilteredEmployees].sort(() => Math.random() - 0.5);
        preFilteredEmployees = shuffled.slice(0, MAX_AI_CONTEXT_ITEMS);
      }
      
      matchedIds = preFilteredEmployees.map(emp => emp.id);
      aiContextSize = matchedIds.length;
      
      console.log(`AI Filter: Fallback mode - using ${aiContextSize} random employees`);
    }

    // Fetch full details for matched employees from the filtered set
    const { data: allFilteredEmployees, error: fetchError } = await query;
    
    if (fetchError) {
      throw new Error(`Failed to fetch employees: ${fetchError.message}`);
    }

    const employees = allFilteredEmployees || [];
    const matchedIdSet = new Set(matchedIds);
    const preFilteredEmployees = employees.filter(emp => matchedIdSet.has(emp.id));
    aiContextSize = preFilteredEmployees.length;

    // Build optimized employee context for AI (only essential fields, truncated skills)
    const employeeContext = preFilteredEmployees.map((emp) => {
      const skillsArray = Array.isArray(emp.skills) ? emp.skills : [];
      // Limit skills to first 5 most relevant (already ranked by proficiency in ideal implementation)
      const truncatedSkills = skillsArray.slice(0, 5).join(', ');
      const skillsDisplay = skillsArray.length > 5 ? `${truncatedSkills}...` : truncatedSkills || 'None';
      return `ID: ${emp.id}, Name: ${emp.name}, Dept: ${emp.department}, Role: ${emp.role}, Skills: ${skillsDisplay}`;
    }).join('\n');

    // Diagnostic logging
    const contextCharCount = employeeContext.length;
    const estimatedTokens = Math.ceil(contextCharCount / 4);
    console.log(`AI Filter: ${datasetSize} total employees, using ${aiContextSize} semantically relevant (context: ~${estimatedTokens} tokens)`);

    // Call LONGCAT API to analyze the query and match employees with timeout
    const aiStartTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch('https://api.longcat.chat/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LONGCAT_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'LongCat-Flash-Chat',
        messages: [
          {
            role: 'system',
            content: `You are an employee filtering assistant. Based on the user's query about skills, roles, or departments, identify which employees match the criteria. 

Available employees:
${employeeContext}

${wasSampled ? `Note: This is a fallback sample of ${preFilteredEmployees.length} out of ${datasetSize} total employees. Focus on finding matches within this sample. If the user asks for skills not visible here, note that results may be incomplete due to fallback sampling.` : ''}

Return your response as a JSON array of employee IDs that match the query. Only include the IDs, nothing else. If no employees match, return an empty array [].

IMPORTANT: These employees were selected using semantic vector search (Supabase AI gte-small) based on their relevance to the query. They are the most semantically similar candidates from the entire dataset.`, 
          },
          { role: 'user', content: validatedData.query },
        ],
        max_tokens: MAX_TOKENS,
        temperature: 0.3,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const aiTime = Date.now() - aiStartTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`LONGCAT API error: ${response.status} ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '[]';
    
    console.log(`AI Filter: AI responded in ${(aiTime / 1000).toFixed(2)}s (${aiResponse.length} chars)`);
    
    // Parse AI response to get employee IDs selected by AI
    let aiSelectedIds: string[] = [];
    try {
      // Clean the response to ensure valid JSON
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      aiSelectedIds = JSON.parse(cleanedResponse);
      console.log(`AI Filter: AI selected ${aiSelectedIds.length} employees from ${aiContextSize} candidates`);
    } catch (parseError) {
      console.error('AI Filter: Failed to parse AI response:', aiResponse);
      aiSelectedIds = [];
    }

    // Use Set for O(1) lookups
    const finalMatchedIdSet = new Set(aiSelectedIds);
    const filteredEmployees = allFilteredEmployees.filter((emp: Employee) => finalMatchedIdSet.has(emp.id));
    
    console.log(`AI Filter: Final result: ${filteredEmployees.length} matches from full dataset`);

    const page = validatedData.page || 1;
    const limit = validatedData.limit || 10;
    const offset = (page - 1) * limit;
    const total = filteredEmployees.length;
    const totalPages = Math.ceil(total / limit);

    const paginatedEmployees = filteredEmployees.slice(offset, offset + limit);

    const totalTime = Date.now() - requestStartTime;
    console.log(`AI Filter: Total request completed in ${(totalTime / 1000).toFixed(2)}s (Search: ${(searchTime / 1000).toFixed(2)}s, AI: ${(aiTime / 1000).toFixed(2)}s)`);

    return NextResponse.json({
      data: paginatedEmployees,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      meta: {
        datasetSize,
        semanticMatches: aiContextSize,
        matchedCount: filteredEmployees.length,
        wasSampled,
        model: 'Supabase AI gte-small + LongCat-Flash-Chat',
        searchMethod: wasSampled ? 'random_fallback' : 'semantic_vector',
        timing: {
          totalSec: Number((totalTime / 1000).toFixed(2)),
          searchSec: Number((searchTime / 1000).toFixed(2)),
          aiSec: Number((aiTime / 1000).toFixed(2)),
        },
      },
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ApiResponse = {
        code: 'VALIDATION_ERROR',
        message: error.errors[0].message,
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const errorResponse: ApiResponse = {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    };
    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
