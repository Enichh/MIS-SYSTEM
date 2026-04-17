import type { Project } from '@/types'
import { getProjects } from '@/lib/utils/api'

export default async function ProjectList() {
  try {
    const projects = await getProjects()

    if (!projects || projects.length === 0) {
      return (
        <div className="empty-state">
        <h3>No Projects Found</h3>
        <p>Click &quot;Add Project&quot; to create your first project.</p>
        </div>
      )
    }

    return (
      <div className="data-list">
        {projects.map((project) => (
          <div key={project.id} className="data-card">
            <div className="data-card-header">
              <div>
                <div className="data-card-title">{project.name}</div>
                <div className="data-card-subtitle">
                  {project.description || 'No description'}
                </div>
              </div>
              <span className={`status-badge status-${project.status}`}>
                {project.status}
              </span>
            </div>
            <div className="data-card-body">
              {project.startDate && (
                <p>
                  <strong>Start Date:</strong> {project.startDate}
                </p>
              )}
              {project.endDate && (
                <p>
                  <strong>End Date:</strong> {project.endDate}
                </p>
              )}
            </div>
            <div className="data-card-actions">
              <button
                data-action="edit"
                data-entity="project"
                data-id={project.id}
                className="btn-secondary"
              >
                Edit
              </button>
              <button
                data-action="delete"
                data-entity="project"
                data-id={project.id}
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
        <h3>Error Loading Projects</h3>
        <p>Failed to load projects. Please refresh the page.</p>
      </div>
    )
  }
}
