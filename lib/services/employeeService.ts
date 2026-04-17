import { fetchFromDatabase } from '@/lib/utils/database'
import type { Employee } from '@/types'

export async function getEmployees(filters?: Record<string, unknown>): Promise<Employee[]> {
  return fetchFromDatabase('employees', filters) as Promise<Employee[]>
}
