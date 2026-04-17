import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchFromDatabase } from './database';

// Mock the Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: [],
        error: null,
      })),
    })),
  })),
};

vi.mock('../supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('fetchFromDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error for invalid table name', async () => {
    await expect(fetchFromDatabase('invalid_table')).rejects.toThrow('Invalid table name: invalid_table');
  });

  it('should throw error for SQL injection attempt', async () => {
    await expect(fetchFromDatabase('employees; DROP TABLE employees--')).rejects.toThrow('Invalid table name');
  });

  it('should accept valid table names', async () => {
    const validTables = ['employees', 'projects', 'tasks', 'employee_projects'];
    
    for (const table of validTables) {
      const result = await fetchFromDatabase(table);
      expect(Array.isArray(result)).toBe(true);
    }
  });

  it('should handle empty filters', async () => {
    const result = await fetchFromDatabase('employees', {});
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle filters with id', async () => {
    const result = await fetchFromDatabase('employees', { id: '123' });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle filters with status', async () => {
    const result = await fetchFromDatabase('projects', { status: 'active' });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle filters with projectId', async () => {
    const result = await fetchFromDatabase('tasks', { projectId: '123' });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle filters with assignedTo', async () => {
    const result = await fetchFromDatabase('tasks', { assignedTo: '123' });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle filters with employee_id', async () => {
    const result = await fetchFromDatabase('employee_projects', { employee_id: '123' });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle filters with project_id', async () => {
    const result = await fetchFromDatabase('employee_projects', { project_id: '123' });
    expect(Array.isArray(result)).toBe(true);
  });
});
