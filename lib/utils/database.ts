import { createClient } from '../supabase/server';

const supabase = createClient();

export async function fetchFromDatabase(
  tableName: string,
  filters: Record<string, unknown> = {}
): Promise<unknown[]> {
  let query = supabase.from(tableName).select('*');

  if (filters.id) {
    query = query.eq('id', filters.id as string);
  }
  if (filters.status) {
    query = query.eq('status', filters.status as string);
  }
  if (filters.projectId) {
    query = query.eq('projectId', filters.projectId as string);
  }
  if (filters.assignedTo) {
    query = query.eq('assignedTo', filters.assignedTo as string);
  }
  if (filters.employee_id) {
    query = query.eq('employee_id', filters.employee_id as string);
  }
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id as string);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Database query error:', error);
    throw new Error(`Failed to fetch from ${tableName}: ${error.message}`);
  }

  return data || [];
}
