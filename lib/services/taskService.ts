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
  console.log(`[TASK_CREATE] Creating task: ${data.title} - ProjectID: ${data.projectId}, Status: ${data.status}, Priority: ${data.priority}`);
  const result = await insertToDatabase<Task>('tasks', data);
  console.log(`[TASK_CREATE] Task created successfully: ID=${result.id}, Title=${result.title}`);
  return result;
}

/**
 * Deletes a task record by ID
 * @param id - The ID of the task to delete
 * @returns The deleted task record
 */
export async function deleteTask(id: string): Promise<Task> {
  return deleteFromDatabase<Task>('tasks', id)
}
