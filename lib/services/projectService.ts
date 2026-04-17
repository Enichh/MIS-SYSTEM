import { fetchFromDatabase, insertToDatabase } from '@/lib/utils/database'
import type { Project } from '@/types'

export async function getProjects(filters?: Record<string, unknown>): Promise<Project[]> {
  return fetchFromDatabase<Project>('projects', filters)
}

/**
 * Creates a new project record
 * @param data - Project data excluding auto-generated fields (id, created_at, updated_at)
 * @returns The created project record
 */
export async function createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
  return insertToDatabase<Project>('projects', data)
}
