import type { Task, Project } from '@/types'
import { headers } from 'next/headers'

async function fetchTasks(): Promise<Task[]> {
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  const baseUrl = `${protocol}://${host}`

  const response = await fetch(`${baseUrl}/api/tasks`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }
  return response.json()
}

async function fetchProjects(): Promise<Project[]> {
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  const baseUrl = `${protocol}://${host}`

  const response = await fetch(`${baseUrl}/api/projects`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch projects')
  }
  return response.json()
}

export default async function TaskList() {
  try {
    const [tasks, projects] = await Promise.all([fetchTasks(), fetchProjects()])

    const projectMap = new Map(projects.map((p) => [p.id, p.name]))

    if (!tasks || tasks.length === 0) {
      return (
        <div className="empty-state">
        <h3>No Tasks Found</h3>
        <p>Click &quot;Add Task&quot; to create your first task.</p>
        </div>
      )
    }

    return (
      <div className="data-list">
        {tasks.map((task) => (
          <div key={task.id} className="data-card">
            <div className="data-card-header">
              <div>
                <div className="data-card-title">{task.title}</div>
                <div className="data-card-subtitle">
                  {projectMap.get(task.projectId) || 'Unknown Project'}
                </div>
              </div>
              <span className={`status-badge status-${task.status}`}>
                {task.status}
              </span>
            </div>
            <div className="data-card-body">
              {task.description && (
                <p>
                  <strong>Description:</strong> {task.description}
                </p>
              )}
              {task.assignedTo && (
                <p>
                  <strong>Assigned To:</strong> {task.assignedTo}
                </p>
              )}
              {task.dueDate && (
                <p>
                  <strong>Due Date:</strong> {task.dueDate}
                </p>
              )}
            </div>
            <div className="data-card-actions">
              <button
                data-action="edit"
                data-entity="task"
                data-id={task.id}
                className="btn-secondary"
              >
                Edit
              </button>
              <button
                data-action="delete"
                data-entity="task"
                data-id={task.id}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  } catch (error) {
    return (
      <div className="empty-state">
        <h3>Error Loading Tasks</h3>
        <p>Failed to load tasks. Please refresh the page.</p>
      </div>
    )
  }
}
