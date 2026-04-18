import { fetchFromDatabase, insertToDatabase, deleteFromDatabase, updateToDatabase } from '@/lib/utils/database'
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
  console.log(`[EMPLOYEE_CREATE] Creating employee: ${data.name} (${data.email}) - Role: ${data.role}, Department: ${data.department}`);
  const result = await insertToDatabase<Employee>('employees', data);
  console.log(`[EMPLOYEE_CREATE] Employee created successfully: ID=${result.id}, Name=${result.name}`);
  return result;
}

/**
 * Updates an employee record by ID
 * @param id - The ID of the employee to update
 * @param data - The employee data to update
 * @returns The updated employee record
 */
export async function updateEmployee(id: string, data: Partial<Omit<Employee, 'id' | 'created_at' | 'updated_at'>>): Promise<Employee> {
  return updateToDatabase<Employee>('employees', id, data)
}

/**
 * Deletes an employee record by ID
 * @param id - The ID of the employee to delete
 * @returns The deleted employee record
 */
export async function deleteEmployee(id: string): Promise<Employee> {
  return deleteFromDatabase<Employee>('employees', id)
}
