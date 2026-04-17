import { fetchFromDatabase } from '@/lib/utils/database'
import type { Project } from '@/types'

export async function getProjects(filters?: Record<string, unknown>): Promise<Project[]> {
  return fetchFromDatabase('projects', filters) as Promise<Project[]>
}
