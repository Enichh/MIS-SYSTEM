import { createClient } from '@/lib/supabase/server';
import type { Employee, Project, Task } from '@/types';

const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-embedding`
  : '';

/**
 * Embedding Utilities using Supabase AI (gte-small)
 * 
 * Architecture:
 * - Embeddings generated via Supabase Edge Function using built-in AI
 * - 384 dimensions, cosine similarity for semantic search
 * - Model runs on Supabase infrastructure (no loading delays)
 * - Hybrid search: combines vector similarity + keyword matching
 */

/**
 * Generate embedding for text using Supabase AI (gte-small)
 * Uses direct fetch with service role key
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ text, normalize: true }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Embedding generation failed:', response.status, errorText);
    throw new Error(`Edge Function error: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  if (!data?.embedding || !Array.isArray(data.embedding)) {
    throw new Error('Invalid embedding response from Edge Function');
  }

  return data.embedding;
}

/**
 * Build searchable text from employee data
 * BGE works best with: "Role with skills in domain"
 */
export function buildEmployeeText(employee: Employee): string {
  const skills = Array.isArray(employee.skills) ? employee.skills.join(', ') : '';
  return `${employee.name} is a ${employee.role} in ${employee.department} with skills in ${skills}`.trim();
}

/**
 * Build searchable text from project data
 */
export function buildProjectText(project: Project): string {
  const description = project.description || '';
  return `${project.name} ${description} ${project.status} priority ${project.priority} project`.trim();
}

/**
 * Build searchable text from task data
 */
export function buildTaskText(task: Task): string {
  const description = task.description || '';
  return `${task.title} ${description} ${task.priority} priority ${task.status} status`.trim();
}

/**
 * Update employee embedding
 */
export async function updateEmployeeEmbedding(employee_id: string): Promise<void> {
  const supabase = await createClient();
  
  // Fetch employee data
  const { data: employee, error: fetchError } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employee_id)
    .single();

  if (fetchError || !employee) {
    throw new Error(`Failed to fetch employee: ${fetchError?.message || 'Not found'}`);
  }

  // Generate embedding
  const text = buildEmployeeText(employee as Employee);
  const embedding = await generateEmbedding(text);

  // Update record
  const { error: updateError } = await supabase
    .from('employees')
    .update({ embedding })
    .eq('id', employee_id);

  if (updateError) {
    throw new Error(`Failed to update employee embedding: ${updateError.message}`);
  }
}

/**
 * Update project embedding
 */
export async function updateProjectEmbedding(project_id: string): Promise<void> {
  const supabase = await createClient();
  
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single();

  if (fetchError || !project) {
    throw new Error(`Failed to fetch project: ${fetchError?.message || 'Not found'}`);
  }

  const text = buildProjectText(project as Project);
  const embedding = await generateEmbedding(text);

  const { error: updateError } = await supabase
    .from('projects')
    .update({ embedding })
    .eq('id', project_id);

  if (updateError) {
    throw new Error(`Failed to update project embedding: ${updateError.message}`);
  }
}

/**
 * Update task embedding
 */
export async function updateTaskEmbedding(task_id: string): Promise<void> {
  const supabase = await createClient();
  
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', task_id)
    .single();

  if (fetchError || !task) {
    throw new Error(`Failed to fetch task: ${fetchError?.message || 'Not found'}`);
  }

  const text = buildTaskText(task as Task);
  const embedding = await generateEmbedding(text);

  const { error: updateError } = await supabase
    .from('tasks')
    .update({ embedding })
    .eq('id', task_id);

  if (updateError) {
    throw new Error(`Failed to update task embedding: ${updateError.message}`);
  }
}

/**
 * Hybrid search: combines semantic vector search + keyword text search
 * Returns top K results by combined relevance score
 * 
 * This solves the "vector only" limitation where exact keywords (IDs, acronyms) might be missed
 */
async function hybridSearchEmployees(
  supabase: any,
  query: string,
  keywords: string[],
  matchCount: number
): Promise<{ id: string; hybridScore: number; vectorSimilarity: number; keywordScore: number }[]> {
  // Generate embedding for semantic search
  const queryEmbedding = await generateEmbedding(query);

  // Run BOTH searches in parallel
  const [vectorResults, keywordResults] = await Promise.all([
    // Semantic vector search (top 100 for ranking pool)
    supabase.rpc('match_employees', {
      query_embedding: queryEmbedding,
      match_count: Math.max(matchCount * 2, 100), // Get more for ranking pool
    }),
    
    // Keyword text search using PostgreSQL full-text search
    supabase
      .from('employees')
      .select('id, name, role, department, skills')
      .or(`name.ilike.%${keywords.join('%, name.ilike.%')}%, role.ilike.%${keywords.join('%, role.ilike.%')}%, department.ilike.%${keywords.join('%, department.ilike.%')}%`)
      .limit(matchCount * 2)
  ]);

  if (vectorResults.error) throw new Error(`Vector search failed: ${vectorResults.error.message}`);
  if (keywordResults.error) throw new Error(`Keyword search failed: ${keywordResults.error.message}`);

  // Build combined scores
  const scores = new Map<string, { vector: number; keyword: number }>();

  // Add vector scores (normalized to 0-1, where 1 = best match)
  (vectorResults.data || []).forEach((row: any) => {
    scores.set(row.id, { vector: row.similarity || 0, keyword: 0 });
  });

  // Add keyword scores (binary match = 1.0)
  (keywordResults.data || []).forEach((row: any) => {
    const existing = scores.get(row.id);
    if (existing) {
      existing.keyword = 1.0; // Boost existing vector results
    } else {
      scores.set(row.id, { vector: 0, keyword: 0.8 }); // Slightly lower for keyword-only
    }
  });

  // Calculate hybrid score: 70% vector + 30% keyword
  // This ensures semantic meaning is primary, but exact keyword matches get a boost
  const hybridResults = Array.from(scores.entries())
    .map(([id, scores]) => ({
      id,
      hybridScore: (scores.vector * 0.7) + (scores.keyword * 0.3),
      vectorSimilarity: scores.vector,
      keywordScore: scores.keyword,
    }))
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, matchCount);

  return hybridResults;
}

/**
 * Extract keywords from query for text search
 */
function extractKeywords(query: string): string[] {
  // Extract words longer than 3 chars, exclude common words
  const commonWords = ['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'they', 'will', 'would', 'could', 'should', 'what', 'when', 'where', 'which', 'their', 'there'];
  
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .map(word => word.replace(/[^a-z0-9]/g, '')) // Remove special chars
    .filter(word => word.length > 0);
}

/**
 * Semantic search for employees using hybrid (vector + keyword) approach
 * Replaces random sampling with targeted, relevant retrieval
 */
export async function searchEmployeesByEmbedding(
  query: string,
  options: {
    matchCount?: number;
    useHybrid?: boolean;
  } = {}
): Promise<{ id: string; similarity: number; hybridScore?: number }[]> {
  const supabase = await createClient();
  const { matchCount = 50, useHybrid = true } = options;

  try {
    if (useHybrid) {
      // Hybrid search: vector + keyword
      const keywords = extractKeywords(query);
      
      if (keywords.length === 0) {
        // Fall back to pure vector if no good keywords
        const { data, error } = await supabase.rpc('match_employees', {
          query_embedding: await generateEmbedding(query),
          match_count: matchCount,
        });
        if (error) throw error;
        return (data || []).map((row: any) => ({ id: row.id, similarity: row.similarity }));
      }

      const hybridResults = await hybridSearchEmployees(supabase, query, keywords, matchCount);
      
      return hybridResults.map(r => ({
        id: r.id,
        similarity: r.vectorSimilarity,
        hybridScore: r.hybridScore,
      }));
    } else {
      // Pure vector search (fallback)
      const queryEmbedding = await generateEmbedding(query);
      const { data, error } = await supabase.rpc('match_employees', {
        query_embedding: queryEmbedding,
        match_count: matchCount,
      });
      
      if (error) throw new Error(`Search failed: ${error.message}`);
      
      return (data || []).map((row: any) => ({
        id: row.id,
        similarity: row.similarity,
      }));
    }
  } catch (error) {
    console.error('Semantic search failed:', error);
    throw error;
  }
}

/**
 * Semantic search for projects
 * Simple top-K vector search - no threshold needed
 */
export async function searchProjectsByEmbedding(
  query: string,
  options: {
    matchCount?: number;
  } = {}
): Promise<{ id: string; similarity: number }[]> {
  const supabase = await createClient();
  const { matchCount = 50 } = options;

  try {
    const queryEmbedding = await generateEmbedding(query);
    
    const { data, error } = await supabase.rpc('match_projects', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
    });
    
    if (error) throw new Error(`Search failed: ${error.message}`);
    
    return (data || []).map((row: any) => ({
      id: row.id,
      similarity: row.similarity,
    }));
  } catch (error) {
    console.error('Semantic search failed:', error);
    throw error;
  }
}

/**
 * Semantic search for tasks
 * Simple top-K vector search - no threshold needed
 */
export async function searchTasksByEmbedding(
  query: string,
  options: {
    matchCount?: number;
  } = {}
): Promise<{ id: string; similarity: number }[]> {
  const supabase = await createClient();
  const { matchCount = 50 } = options;

  try {
    const queryEmbedding = await generateEmbedding(query);

    const { data, error } = await supabase.rpc('match_tasks', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
    });

    if (error) throw new Error(`Search failed: ${error.message}`);

    return (data || []).map((row: any) => ({
      id: row.id,
      similarity: row.similarity,
    }));
  } catch (error) {
    console.error('Semantic search failed:', error);
    throw error;
  }
}

// ============================================================================
// BATCH BACKFILL FUNCTIONS
// Use these to populate embeddings for existing data
// ============================================================================

/**
 * Backfill embeddings for all employees without embeddings
 * Processes in batches to avoid rate limits
 */
export async function backfillEmployeeEmbeddings(
  options: {
    batchSize?: number;
    delayMs?: number;
    onProgress?: (completed: number, total: number, currentId: string) => void;
  } = {}
): Promise<{ success: number; failed: number; total: number }> {
  const { batchSize = 10, delayMs = 500, onProgress } = options;
  const supabase = await createClient();

  // Get all employees without embeddings
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, name, role, department, skills')
    .is('embedding', null);

  if (error) throw new Error(`Failed to fetch employees: ${error.message}`);
  if (!employees || employees.length === 0) {
    console.log('All employees already have embeddings');
    return { success: 0, failed: 0, total: 0 };
  }

  const total = employees.length;
  let success = 0;
  let failed = 0;

  console.log(`Starting backfill for ${total} employees...`);

  for (let i = 0; i < employees.length; i += batchSize) {
    const batch = employees.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (emp) => {
        try {
          const text = buildEmployeeText(emp as Employee);
          const embedding = await generateEmbedding(text);

          const { error: updateError } = await supabase
            .from('employees')
            .update({ embedding })
            .eq('id', emp.id);

          if (updateError) throw updateError;

          success++;
          onProgress?.(success + failed, total, emp.id);
          console.log(`[${success + failed}/${total}] Embedded: ${emp.name}`);
        } catch (err) {
          failed++;
          console.error(`Failed to embed ${emp.name}:`, err);
        }
      })
    );

    // Delay between batches to avoid rate limiting
    if (i + batchSize < employees.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`Backfill complete: ${success} succeeded, ${failed} failed out of ${total}`);
  return { success, failed, total };
}

/**
 * Backfill embeddings for all projects without embeddings
 */
export async function backfillProjectEmbeddings(
  options: {
    batchSize?: number;
    delayMs?: number;
    onProgress?: (completed: number, total: number, currentId: string) => void;
  } = {}
): Promise<{ success: number; failed: number; total: number }> {
  const { batchSize = 10, delayMs = 500, onProgress } = options;
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, description, status, priority')
    .is('embedding', null);

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  if (!projects || projects.length === 0) {
    console.log('All projects already have embeddings');
    return { success: 0, failed: 0, total: 0 };
  }

  const total = projects.length;
  let success = 0;
  let failed = 0;

  console.log(`Starting backfill for ${total} projects...`);

  for (let i = 0; i < projects.length; i += batchSize) {
    const batch = projects.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (proj) => {
        try {
          const text = buildProjectText(proj as Project);
          const embedding = await generateEmbedding(text);

          const { error: updateError } = await supabase
            .from('projects')
            .update({ embedding })
            .eq('id', proj.id);

          if (updateError) throw updateError;

          success++;
          onProgress?.(success + failed, total, proj.id);
          console.log(`[${success + failed}/${total}] Embedded: ${proj.name}`);
        } catch (err) {
          failed++;
          console.error(`Failed to embed ${proj.name}:`, err);
        }
      })
    );

    if (i + batchSize < projects.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`Backfill complete: ${success} succeeded, ${failed} failed out of ${total}`);
  return { success, failed, total };
}

/**
 * Backfill embeddings for all tasks without embeddings
 */
export async function backfillTaskEmbeddings(
  options: {
    batchSize?: number;
    delayMs?: number;
    onProgress?: (completed: number, total: number, currentId: string) => void;
  } = {}
): Promise<{ success: number; failed: number; total: number }> {
  const { batchSize = 10, delayMs = 500, onProgress } = options;
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, description, priority, status')
    .is('embedding', null);

  if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
  if (!tasks || tasks.length === 0) {
    console.log('All tasks already have embeddings');
    return { success: 0, failed: 0, total: 0 };
  }

  const total = tasks.length;
  let success = 0;
  let failed = 0;

  console.log(`Starting backfill for ${total} tasks...`);

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (task) => {
        try {
          const text = buildTaskText(task as Task);
          const embedding = await generateEmbedding(text);

          const { error: updateError } = await supabase
            .from('tasks')
            .update({ embedding })
            .eq('id', task.id);

          if (updateError) throw updateError;

          success++;
          onProgress?.(success + failed, total, task.id);
          console.log(`[${success + failed}/${total}] Embedded: ${task.title}`);
        } catch (err) {
          failed++;
          console.error(`Failed to embed ${task.title}:`, err);
        }
      })
    );

    if (i + batchSize < tasks.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`Backfill complete: ${success} succeeded, ${failed} failed out of ${total}`);
  return { success, failed, total };
}
