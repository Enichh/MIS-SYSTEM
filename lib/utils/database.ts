import { createClient } from '../supabase/server';

const VALID_TABLES = ['employees', 'projects', 'tasks', 'employee_projects'] as const;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchFromDatabase<T = unknown>(
  tableName: string,
  filters: Record<string, unknown> = {},
  options: { skipPagination?: boolean } = {}
): Promise<T[]> {
  if (!VALID_TABLES.includes(tableName as any)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  const supabase = await createClient();
  let query = supabase.from(tableName).select('*', { count: 'exact' });

  if (filters.id) {
    query = query.eq('id', filters.id as string);
  }
  if (filters.status) {
    query = query.eq('status', filters.status as string);
  }
  if (filters.priority) {
    query = query.eq('priority', filters.priority as string);
  }
  if (filters.projectId || filters.projectid) {
    query = query.eq('projectid', (filters.projectId || filters.projectid) as string);
  }
  if (filters.assignedTo || filters.assignedto) {
    query = query.eq('assignedto', (filters.assignedTo || filters.assignedto) as string);
  }
  if (filters.name) {
    const nameColumn = tableName === 'tasks' ? 'title' : 'name';
    query = query.ilike(nameColumn, `%${filters.name as string}%`);
  }
  if (filters.department) {
    query = query.eq('department', filters.department as string);
  }
  if (filters.role) {
    query = query.eq('role', filters.role as string);
  }
  if (filters.employee_id) {
    query = query.eq('employee_id', filters.employee_id as string);
  }
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id as string);
  }

  // Date range filtering for calendar integration
  if (filters.startDateFrom) {
    query = query.gte('startdate', filters.startDateFrom as string);
  }
  if (filters.startDateTo) {
    query = query.lte('startdate', filters.startDateTo as string);
  }
  if (filters.endDateFrom) {
    query = query.gte('enddate', filters.endDateFrom as string);
  }
  if (filters.endDateTo) {
    query = query.lte('enddate', filters.endDateTo as string);
  }
  if (filters.dueDateFrom) {
    query = query.gte('duedate', filters.dueDateFrom as string);
  }
  if (filters.dueDateTo) {
    query = query.lte('duedate', filters.dueDateTo as string);
  }
  if (filters.dateRangeStart && filters.dateRangeEnd) {
    // For calendar: fetch items that overlap with the date range
    if (tableName === 'projects') {
      query = query.or(`startdate.lte.${filters.dateRangeEnd},enddate.gte.${filters.dateRangeStart}`);
    } else if (tableName === 'tasks') {
      query = query.gte('duedate', filters.dateRangeStart as string).lte('duedate', filters.dateRangeEnd as string);
    }
  }

  // Progress range filtering for projects
  if (filters.progressMin && tableName === 'projects') {
    query = query.gte('progress', filters.progressMin as number);
  }
  if (filters.progressMax && tableName === 'projects') {
    query = query.lte('progress', filters.progressMax as number);
  }

  // Pagination
  if (!options.skipPagination) {
    const page = filters.page ? parseInt(filters.page as string) : 1;
    const limit = filters.limit ? parseInt(filters.limit as string) : 10;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Database query error:', error);
    throw new Error(`Failed to fetch from ${tableName}: ${error.message}`);
  }

  return (data || []) as T[];
}

export async function fetchFromDatabasePaginated<T = unknown>(
  tableName: string,
  filters: Record<string, unknown> = {}
): Promise<PaginatedResponse<T>> {
  if (!VALID_TABLES.includes(tableName as any)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  const supabase = await createClient();
  let query = supabase.from(tableName).select('*', { count: 'exact' });

  if (filters.id) {
    query = query.eq('id', filters.id as string);
  }
  if (filters.status) {
    query = query.eq('status', filters.status as string);
  }
  if (filters.priority) {
    query = query.eq('priority', filters.priority as string);
  }
  if (filters.projectId || filters.projectid) {
    query = query.eq('projectid', (filters.projectId || filters.projectid) as string);
  }
  if (filters.assignedTo || filters.assignedto) {
    query = query.eq('assignedto', (filters.assignedTo || filters.assignedto) as string);
  }
  if (filters.name) {
    const nameColumn = tableName === 'tasks' ? 'title' : 'name';
    query = query.ilike(nameColumn, `%${filters.name as string}%`);
  }
  if (filters.department) {
    query = query.eq('department', filters.department as string);
  }
  if (filters.role) {
    query = query.eq('role', filters.role as string);
  }
  if (filters.employee_id) {
    query = query.eq('employee_id', filters.employee_id as string);
  }
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id as string);
  }

  // Date range filtering for calendar integration
  if (filters.startDateFrom) {
    query = query.gte('startdate', filters.startDateFrom as string);
  }
  if (filters.startDateTo) {
    query = query.lte('startdate', filters.startDateTo as string);
  }
  if (filters.endDateFrom) {
    query = query.gte('enddate', filters.endDateFrom as string);
  }
  if (filters.endDateTo) {
    query = query.lte('enddate', filters.endDateTo as string);
  }
  if (filters.dueDateFrom) {
    query = query.gte('duedate', filters.dueDateFrom as string);
  }
  if (filters.dueDateTo) {
    query = query.lte('duedate', filters.dueDateTo as string);
  }
  if (filters.dateRangeStart && filters.dateRangeEnd) {
    if (tableName === 'projects') {
      query = query.or(`startdate.lte.${filters.dateRangeEnd},enddate.gte.${filters.dateRangeStart}`);
    } else if (tableName === 'tasks') {
      query = query.gte('duedate', filters.dateRangeStart as string).lte('duedate', filters.dateRangeEnd as string);
    }
  }

  // Progress range filtering for projects
  if (filters.progressMin && tableName === 'projects') {
    query = query.gte('progress', filters.progressMin as number);
  }
  if (filters.progressMax && tableName === 'projects') {
    query = query.lte('progress', filters.progressMax as number);
  }

  // Pagination
  const page = filters.page ? parseInt(filters.page as string) : 1;
  const limit = filters.limit ? parseInt(filters.limit as string) : 10;
  const offset = (page - 1) * limit;

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Database query error:', error);
    throw new Error(`Failed to fetch from ${tableName}: ${error.message}`);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: (data || []) as T[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
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
