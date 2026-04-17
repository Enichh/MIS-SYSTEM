'use client';

import { useState, useEffect } from 'react';
import type { Project } from '@/types';
import DeleteConfirmation from '@/components/confirmation/DeleteConfirmation/DeleteConfirmation';

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    projectId: string | null;
    projectName: string;
  }>({
    isOpen: false,
    projectId: null,
    projectName: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (project: Project) => {
    setDeleteConfirmation({
      isOpen: true,
      projectId: project.id,
      projectName: project.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.projectId) return;

    try {
      const response = await fetch(`/api/projects/${deleteConfirmation.projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setDeleteConfirmation({ isOpen: false, projectId: null, projectName: '' });
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, projectId: null, projectName: '' });
  };

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading Projects...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <h3>Error Loading Projects</h3>
        <p>Failed to load projects. Please refresh the page.</p>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Projects Found</h3>
        <p>Click &quot;Add Project&quot; to create your first project.</p>
      </div>
    );
  }

  return (
    <>
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
                onClick={() => handleDeleteClick(project)}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        entityName={deleteConfirmation.projectName}
        entityType="Project"
        variant="danger"
      />
    </>
  );
}
