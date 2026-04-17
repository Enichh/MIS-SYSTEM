import { fetchFromDatabase } from '@/lib/utils/database'
import type { Task } from '@/types'

export async function getTasks(filters?: Record<string, unknown>): Promise<Task[]> {
  return fetchFromDatabase('tasks', filters) as Promise<Task[]>
}
