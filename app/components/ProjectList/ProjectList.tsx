'use client';

import { useState, useEffect } from 'react';
import type { Project } from '@/types';
import { Button } from '@/app/components/ui/Button/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/components/ui/Card/Card';
import { Badge } from '@/app/components/ui/Badge/Badge';
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
      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>
                    {project.description || 'No description'}
                  </CardDescription>
                </div>
                <Badge variant={project.status === 'active' ? 'default' : project.status === 'completed' ? 'secondary' : 'outline'}>
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {project.startDate && (
                <p className="text-sm">
                  <span className="font-medium">Start Date:</span> {project.startDate}
                </p>
              )}
              {project.endDate && (
                <p className="text-sm">
                  <span className="font-medium">End Date:</span> {project.endDate}
                </p>
              )}
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                variant="secondary"
                icon="edit"
                data-action="edit"
                data-entity="project"
                data-id={project.id}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                icon="trash"
                onClick={() => handleDeleteClick(project)}
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
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
