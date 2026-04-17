import { createClient } from '../supabase/server';

const VALID_TABLES = ['employees', 'projects', 'tasks', 'employee_projects'] as const;

export async function fetchFromDatabase<T = unknown>(
  tableName: string,
  filters: Record<string, unknown> = {}
): Promise<T[]> {
  if (!VALID_TABLES.includes(tableName as any)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  const supabase = await createClient();
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
  if (filters.name) {
    const nameColumn = tableName === 'tasks' ? 'title' : 'name';
    query = query.ilike(nameColumn, `%${filters.name as string}%`);
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

  return (data || []) as T[];
}

/**
 * Inserts a record into the specified database table
 * @param tableName - The name of the table to insert into (must be in VALID_TABLES)
 * @param data - The record data to insert
 * @returns The inserted record
 * @throws Error if table name is invalid or insert fails
 */
export async function insertToDatabase<T = unknown>(
  tableName: string,
  data: Record<string, unknown>
): Promise<T> {
  if (!VALID_TABLES.includes(tableName as any)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  const supabase = await createClient();
  const { data: insertedData, error } = await supabase
    .from(tableName)
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Database insert error:', error);
    throw new Error(`Failed to insert into ${tableName}: ${error.message}`);
  }

  return insertedData;
}

/**
 * Updates a record in the specified database table
 * @param tableName - The name of the table to update (must be in VALID_TABLES)
 * @param id - The ID of the record to update
 * @param data - The record data to update
 * @returns The updated record
 * @throws Error if table name is invalid or update fails
 */
export async function updateToDatabase<T = unknown>(
  tableName: string,
  id: string,
  data: Record<string, unknown>
): Promise<T> {
  if (!VALID_TABLES.includes(tableName as any)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  const supabase = await createClient();
  const { data: updatedData, error } = await supabase
    .from(tableName)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Database update error:', error);
    throw new Error(`Failed to update ${tableName}: ${error.message}`);
  }

  return updatedData;
}

/**
 * Deletes a record from the specified database table
 * @param tableName - The name of the table to delete from (must be in VALID_TABLES)
 * @param id - The ID of the record to delete
 * @returns The deleted record
 * @throws Error if table name is invalid or delete fails
 */
export async function deleteFromDatabase<T = unknown>(
  tableName: string,
  id: string
): Promise<T> {
  if (!VALID_TABLES.includes(tableName as any)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  const supabase = await createClient();
  const { data: deletedData, error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Database delete error:', error);
    throw new Error(`Failed to delete from ${tableName}: ${error.message}`);
  }

  return deletedData;
}
