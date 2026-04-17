import { fetchFromDatabase, insertToDatabase, deleteFromDatabase } from '@/lib/utils/database'
import type { Task } from '@/types'

export async function getTasks(filters?: Record<string, unknown>): Promise<Task[]> {
  return fetchFromDatabase<Task>('tasks', filters)
}

/**
 * Creates a new task record
 * @param data - Task data excluding auto-generated fields (id, created_at, updated_at)
 * @returns The created task record
 */
export async function createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  return insertToDatabase<Task>('tasks', data)
}

/**
 * Deletes a task record by ID
 * @param id - The ID of the task to delete
 * @returns The deleted task record
 */
export async function deleteTask(id: string): Promise<Task> {
  return deleteFromDatabase<Task>('tasks', id)
}
