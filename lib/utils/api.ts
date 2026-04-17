import { NextRequest } from 'next/server'
import type { Employee, Project, Task } from '@/types'

/**
 * Call API route handlers directly from server components.
 * This avoids the need for HTTP requests and URL construction.
 */

export async function getEmployees(filters?: Record<string, unknown>): Promise<Employee[]> {
  const { GET } = await import('@/app/api/employees/route')
  const request = new NextRequest('http://localhost', {
    method: 'GET',
  })
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      request.nextUrl.searchParams.set(key, String(value))
    })
  }
  const response = await GET(request)
  const data = await response.json()
  return data as Employee[]
}

export async function getProjects(filters?: Record<string, unknown>): Promise<Project[]> {
  const { GET } = await import('@/app/api/projects/route')
  const request = new NextRequest('http://localhost', {
    method: 'GET',
  })
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      request.nextUrl.searchParams.set(key, String(value))
    })
  }
  const response = await GET(request)
  const data = await response.json()
  return data as Project[]
}

export async function getTasks(filters?: Record<string, unknown>): Promise<Task[]> {
  const { GET } = await import('@/app/api/tasks/route')
  const request = new NextRequest('http://localhost', {
    method: 'GET',
  })
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      request.nextUrl.searchParams.set(key, String(value))
    })
  }
  const response = await GET(request)
  const data = await response.json()
  return data as Task[]
}
