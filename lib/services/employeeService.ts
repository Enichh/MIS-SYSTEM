import { fetchFromDatabase, insertToDatabase } from '@/lib/utils/database'
import type { Employee } from '@/types'

export async function getEmployees(filters?: Record<string, unknown>): Promise<Employee[]> {
  return fetchFromDatabase<Employee>('employees', filters)
}

/**
 * Creates a new employee record
 * @param data - Employee data excluding auto-generated fields (id, created_at, updated_at)
 * @returns The created employee record
 */
export async function createEmployee(data: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
  return insertToDatabase<Employee>('employees', data)
}
