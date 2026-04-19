import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { searchTasksByEmbedding } from '@/lib/utils/embeddings';
import type { Task, ApiResponse } from '@/types';

const TaskFilterSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.string().optional(),
  priority: z.string().optional(),
  projectid: z.string().optional(),
  assignedto: z.string().optional(),
});

const MAX_AI_CONTEXT_ITEMS = 50;
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
    const validatedData = TaskFilterSchema.parse(body);
    const requestStartTime = Date.now();

    // Apply pre-filtering using database filters to reduce dataset size
    const supabase = await createClient();
    let query = supabase.from('tasks').select('*');
    
    if (validatedData.status) query = query.eq('status', validatedData.status);
    if (validatedData.priority) query = query.eq('priority', validatedData.priority);
    if (validatedData.projectid) query = query.eq('projectid', validatedData.projectid);
    if (validatedData.assignedto) query = query.eq('assignedto', validatedData.assignedto);

    // SEMANTIC SEARCH: Use vector similarity instead of random sampling
    let matchedIds: string[] = [];
    let wasSampled = false;
    let datasetSize = 0;
    let aiContextSize = 0;
    let searchTime = 0;

    try {
      // First, get total count for metadata
      const { count, error: countError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      datasetSize = count || 0;

      // Perform semantic search using gte-small embeddings
      console.log(`AI Filter: Starting semantic search for tasks: "${validatedData.query}"`);
      const searchStartTime = Date.now();
      
      const semanticMatches = await searchTasksByEmbedding(validatedData.query, {
        matchCount: MAX_AI_CONTEXT_ITEMS,
      });

      searchTime = Date.now() - searchStartTime;
      matchedIds = semanticMatches.map(m => m.id);
      aiContextSize = matchedIds.length;
      
      console.log(`AI Filter: Semantic search completed in ${(searchTime / 1000).toFixed(2)}s - Found ${aiContextSize} relevant tasks`);
      
      if (aiContextSize === 0) {
        console.log('AI Filter: No semantic matches found, query may have no valid matches');
      }
    } catch (semanticError) {
      console.error('Semantic search failed, falling back to step sampling:', semanticError);
      
      // FALLBACK: Fetch all filtered tasks and use step sampling
      const { data: allFilteredTasks, error: fetchError } = await query;
      
      if (fetchError) throw new Error(`Database fetch failed: ${fetchError.message}`);
      
      datasetSize = allFilteredTasks?.length || 0;
      wasSampled = datasetSize > MAX_AI_CONTEXT_ITEMS;
      
      let preFilteredTasks = allFilteredTasks || [];
      
      if (wasSampled) {
        console.warn(`Large dataset detected (${datasetSize} items). Using step sampling as fallback.`);
        const step = Math.ceil(datasetSize / MAX_AI_CONTEXT_ITEMS);
        preFilteredTasks = allFilteredTasks.filter((_: unknown, index: number) => index % step === 0).slice(0, MAX_AI_CONTEXT_ITEMS);
      }
      
      matchedIds = preFilteredTasks.map((task: Task) => task.id);
      aiContextSize = matchedIds.length;
      
      console.log(`AI Filter: Fallback mode - using ${aiContextSize} sampled tasks`);
    }

    // Fetch full details for matched tasks from the filtered set
    const { data: allFilteredTasks, error: fetchError } = await query;
    
    if (fetchError) {
      throw new Error(`Failed to fetch tasks: ${fetchError.message}`);
    }

    const tasks = allFilteredTasks || [];
    const matchedIdSet = new Set(matchedIds);
    const preFilteredTasks = tasks.filter((task: Task) => matchedIdSet.has(task.id));
    aiContextSize = preFilteredTasks.length;

    // Build optimized task context for AI (only essential fields, truncated)
    const taskContext = preFilteredTasks.map((task: Task) => {
      const depsArray = Array.isArray(task.dependencies) ? task.dependencies : [];
      const truncatedDeps = depsArray.slice(0, 3).join(', ');
      const depsDisplay = depsArray.length > 3 ? `${truncatedDeps}...` : truncatedDeps || 'None';
      return `ID: ${task.id}, Title: ${task.title}, Status: ${task.status}, Priority: ${task.priority}, Project: ${task.projectid}, Assigned: ${task.assignedto || 'Unassigned'}, Due: ${task.duedate || 'None'}, Deps: ${depsDisplay}`;
    }).join('\n');

    // Diagnostic logging
    const contextCharCount = taskContext.length;
    const estimatedTokens = Math.ceil(contextCharCount / 4);
    console.log(`AI Filter: ${datasetSize} total tasks, using ${aiContextSize} semantically relevant (context: ~${estimatedTokens} tokens)`);

    // Call LONGCAT API to analyze the query and match tasks with timeout
    const aiStartTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
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
            content: `You are a task filtering assistant. Based on the user's query about tasks, projects, priorities, or assignments, identify which tasks match the criteria. 

Available tasks:
${taskContext}

${wasSampled ? `Note: This is a fallback sample of ${preFilteredTasks.length} out of ${datasetSize} total tasks. Focus on finding matches within this sample.` : ''}

Return your response as a JSON array of task IDs that match the query. Only include the IDs, nothing else. If no tasks match, return an empty array [].

IMPORTANT: These tasks were selected using semantic vector search (Supabase AI gte-small) based on their relevance to the query. They are the most semantically similar candidates from the entire dataset.`,
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
    
    // Parse AI response to get task IDs selected by AI
    let aiSelectedIds: string[] = [];
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      aiSelectedIds = JSON.parse(cleanedResponse);
      console.log(`AI Filter: AI selected ${aiSelectedIds.length} tasks from ${aiContextSize} candidates`);
    } catch (parseError) {
      console.error('AI Filter: Failed to parse AI response:', aiResponse);
      aiSelectedIds = [];
    }

    // Use Set for O(1) lookups
    const finalMatchedIdSet = new Set(aiSelectedIds);
    const filteredTasks = allFilteredTasks.filter((task: Task) => finalMatchedIdSet.has(task.id));
    
    console.log(`AI Filter: Final result: ${filteredTasks.length} matches from full dataset`);

    const page = validatedData.page || 1;
    const limit = validatedData.limit || 10;
    const offset = (page - 1) * limit;
    const total = filteredTasks.length;
    const totalPages = Math.ceil(total / limit);

    const paginatedTasks = filteredTasks.slice(offset, offset + limit);

    const totalTime = Date.now() - requestStartTime;
    console.log(`AI Filter: Total request completed in ${(totalTime / 1000).toFixed(2)}s (Search: ${(searchTime / 1000).toFixed(2)}s, AI: ${(aiTime / 1000).toFixed(2)}s)`);

    return NextResponse.json({
      data: paginatedTasks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      meta: {
        datasetSize,
        semanticMatches: aiContextSize,
        matchedCount: filteredTasks.length,
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
