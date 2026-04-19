import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { searchProjectsByEmbedding } from '@/lib/utils/embeddings';
import type { Project, ApiResponse } from '@/types';

const ProjectFilterSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.string().optional(),
  priority: z.string().optional(),
  progressMin: z.coerce.number().min(0).max(100).optional(),
  progressMax: z.coerce.number().min(0).max(100).optional(),
});

const MAX_AI_CONTEXT_ITEMS = 50; // Reduced from 500 - top 50 semantic matches is sufficient

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
    const validatedData = ProjectFilterSchema.parse(body);
    const requestStartTime = Date.now();

    // Apply pre-filtering using database filters to reduce dataset size
    const supabase = await createClient();
    let query = supabase.from('projects').select('*');
    
    if (validatedData.status) query = query.eq('status', validatedData.status);
    if (validatedData.priority) query = query.eq('priority', validatedData.priority);
    if (validatedData.progressMin) query = query.gte('progress', validatedData.progressMin);
    if (validatedData.progressMax) query = query.lte('progress', validatedData.progressMax);

    // SEMANTIC SEARCH: Use vector similarity instead of step sampling
    let matchedIds: string[] = [];
    let wasSampled = false;
    let datasetSize = 0;
    let aiContextSize = 0;
    let searchTime = 0;

    try {
      // First, get total count for metadata
      const { count, error: countError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      datasetSize = count || 0;

      // Perform semantic search using BGE embeddings
      console.log(`AI Filter: Starting semantic search for projects: "${validatedData.query}"`);
      const searchStartTime = Date.now();
      
      const semanticMatches = await searchProjectsByEmbedding(validatedData.query, {
        matchCount: MAX_AI_CONTEXT_ITEMS,
      });

      searchTime = Date.now() - searchStartTime;
      matchedIds = semanticMatches.map(m => m.id);
      aiContextSize = matchedIds.length;
      
      console.log(`AI Filter: Semantic search completed in ${(searchTime / 1000).toFixed(2)}s - Found ${aiContextSize} relevant projects`);
      
      // Note: With top-K semantic search, we should always have results if there are any matches
      if (aiContextSize === 0) {
        console.log('AI Filter: No semantic matches found, query may have no valid matches');
      }
    } catch (semanticError) {
      console.error('Semantic search failed, falling back to step sampling:', semanticError);
      
      // FALLBACK: Fetch all filtered projects and use step sampling
      const { data: allFilteredProjects, error: fetchError } = await query;
      
      if (fetchError) throw new Error(`Database fetch failed: ${fetchError.message}`);
      
      datasetSize = allFilteredProjects?.length || 0;
      wasSampled = datasetSize > MAX_AI_CONTEXT_ITEMS;
      
      let preFilteredProjects = allFilteredProjects || [];
      
      if (wasSampled) {
        console.warn(`Large dataset detected (${datasetSize} items). Using step sampling as fallback.`);
        // Sample evenly across the dataset for better representation
        const step = Math.ceil(datasetSize / MAX_AI_CONTEXT_ITEMS);
        preFilteredProjects = allFilteredProjects.filter((_, index) => index % step === 0).slice(0, MAX_AI_CONTEXT_ITEMS);
      }
      
      matchedIds = preFilteredProjects.map(proj => proj.id);
      aiContextSize = matchedIds.length;
      
      console.log(`AI Filter: Fallback mode - using ${aiContextSize} sampled projects`);
    }

    // Fetch full details for matched projects from the filtered set
    const { data: allFilteredProjects, error: fetchError } = await query;
    
    if (fetchError) {
      throw new Error(`Failed to fetch projects: ${fetchError.message}`);
    }

    const projects = allFilteredProjects || [];
    const matchedIdSet = new Set(matchedIds);
    const preFilteredProjects = projects.filter(proj => matchedIdSet.has(proj.id));
    aiContextSize = preFilteredProjects.length;

    // Build optimized project context for AI (only essential fields)
    const projectContext = preFilteredProjects.map((project) => {
      return `ID: ${project.id}, Name: ${project.name}, Status: ${project.status}, Priority: ${project.priority}, Progress: ${project.progress}%, Description: ${project.description || 'None'}`;
    }).join('\n');

    // Diagnostic logging
    const contextCharCount = projectContext.length;
    const estimatedTokens = Math.ceil(contextCharCount / 4);
    console.log(`AI Filter: ${datasetSize} total projects, using ${aiContextSize} semantically relevant (context: ~${estimatedTokens} tokens)`);

    // Call LONGCAT API to analyze the query and match projects with timeout
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
            content: `You are a project filtering assistant. Based on the user's query about projects, status, priority, or progress, identify which projects match the criteria. 

Available projects:
${projectContext}

${wasSampled ? `Note: This is a fallback sample of ${preFilteredProjects.length} out of ${datasetSize} total projects. Match based on the sample and apply similar logic to the full dataset.` : ''}

Return your response as a JSON array of project IDs that match the query. Only include the IDs, nothing else. If no projects match, return an empty array [].

IMPORTANT: These projects were selected using semantic vector search (Supabase AI gte-small) based on their relevance to the query. They are the most semantically similar candidates from the entire dataset.`, 
          },
          { role: 'user', content: validatedData.query },
        ],
        max_tokens: 500,
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
    
    // Parse AI response to get project IDs selected by AI
    let aiSelectedIds: string[] = [];
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      aiSelectedIds = JSON.parse(cleanedResponse);
      console.log(`AI Filter: AI selected ${aiSelectedIds.length} projects from ${aiContextSize} candidates`);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      aiSelectedIds = [];
    }

    // Use Set for O(1) lookups
    const finalMatchedIdSet = new Set(aiSelectedIds);
    const filteredProjects = allFilteredProjects.filter((project: Project) => finalMatchedIdSet.has(project.id));

    const page = validatedData.page || 1;
    const limit = validatedData.limit || 10;
    const offset = (page - 1) * limit;
    const total = filteredProjects.length;
    const totalPages = Math.ceil(total / limit);

    const paginatedProjects = filteredProjects.slice(offset, offset + limit);

    const totalTime = Date.now() - requestStartTime;
    console.log(`AI Filter: Total request completed in ${(totalTime / 1000).toFixed(2)}s (Search: ${(searchTime / 1000).toFixed(2)}s, AI: ${(aiTime / 1000).toFixed(2)}s)`);

    return NextResponse.json({
      data: paginatedProjects,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      meta: {
        datasetSize,
        semanticMatches: aiContextSize,
        matchedCount: filteredProjects.length,
        wasSampled,
        model: 'Supabase AI gte-small + LongCat-Flash-Chat',
        searchMethod: wasSampled ? 'step_sampling_fallback' : 'semantic_vector',
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
