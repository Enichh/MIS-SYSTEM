import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  generateEmbedding, 
  buildEmployeeText, 
  buildProjectText, 
  buildTaskText 
} from '@/lib/utils/embeddings';
import type { Employee, Project, Task, ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

interface SyncRequest {
  entityType: 'employees' | 'projects' | 'tasks' | 'all';
  batchSize?: number;
}

interface SyncResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

/**
 * Admin API to sync embeddings for existing data
 * Use this to backfill embeddings after adding BGE support
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SyncRequest;
    const { entityType, batchSize = 50 } = body;

    if (!entityType || !['employees', 'projects', 'tasks', 'all'].includes(entityType)) {
      const errorResponse: ApiResponse = {
        code: 'VALIDATION_ERROR',
        message: 'entityType must be one of: employees, projects, tasks, all',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const results: Record<string, SyncResult> = {};

    if (entityType === 'employees' || entityType === 'all') {
      results.employees = await syncEmployees(batchSize);
    }

    if (entityType === 'projects' || entityType === 'all') {
      results.projects = await syncProjects(batchSize);
    }

    if (entityType === 'tasks' || entityType === 'all') {
      results.tasks = await syncTasks(batchSize);
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Embedding sync completed for ${entityType}`,
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sync embeddings error:', error);
    const errorResponse: ApiResponse = {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Failed to sync embeddings',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

async function syncEmployees(batchSize: number): Promise<SyncResult> {
  const supabase = await createClient();
  const result: SyncResult = { processed: 0, succeeded: 0, failed: 0, errors: [] };

  // Fetch employees without embeddings
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .is('embedding', null)
    .limit(batchSize);

  if (error) {
    throw new Error(`Failed to fetch employees: ${error.message}`);
  }

  if (!employees || employees.length === 0) {
    return result;
  }

  for (const employee of employees as Employee[]) {
    try {
      result.processed++;
      const text = buildEmployeeText(employee);
      const embedding = await generateEmbedding(text);

      const { error: updateError } = await supabase
        .from('employees')
        .update({ embedding })
        .eq('id', employee.id);

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      result.succeeded++;
    } catch (err) {
      result.failed++;
      result.errors.push(`Employee ${employee.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return result;
}

async function syncProjects(batchSize: number): Promise<SyncResult> {
  const supabase = await createClient();
  const result: SyncResult = { processed: 0, succeeded: 0, failed: 0, errors: [] };

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .is('embedding', null)
    .limit(batchSize);

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  if (!projects || projects.length === 0) {
    return result;
  }

  for (const project of projects as Project[]) {
    try {
      result.processed++;
      const text = buildProjectText(project);
      const embedding = await generateEmbedding(text);

      const { error: updateError } = await supabase
        .from('projects')
        .update({ embedding })
        .eq('id', project.id);

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      result.succeeded++;
    } catch (err) {
      result.failed++;
      result.errors.push(`Project ${project.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return result;
}

async function syncTasks(batchSize: number): Promise<SyncResult> {
  const supabase = await createClient();
  const result: SyncResult = { processed: 0, succeeded: 0, failed: 0, errors: [] };

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .is('embedding', null)
    .limit(batchSize);

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  if (!tasks || tasks.length === 0) {
    return result;
  }

  for (const task of tasks as Task[]) {
    try {
      result.processed++;
      const text = buildTaskText(task);
      const embedding = await generateEmbedding(text);

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ embedding })
        .eq('id', task.id);

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      result.succeeded++;
    } catch (err) {
      result.failed++;
      result.errors.push(`Task ${task.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return result;
}
