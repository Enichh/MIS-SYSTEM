'use client';

import { useState, useEffect } from 'react';
import type { Task, Project } from '@/types';
import { Button } from '@/app/components/ui/Button/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/components/ui/Card/Card';
import { Badge } from '@/app/components/ui/Badge/Badge';
import DeleteConfirmation from '@/components/confirmation/DeleteConfirmation/DeleteConfirmation';

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    taskId: string | null;
    taskTitle: string;
  }>({
    isOpen: false,
    taskId: null,
    taskTitle: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksResponse, projectsResponse] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
      ]);
      
      if (!tasksResponse.ok || !projectsResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const tasksData = await tasksResponse.json();
      const projectsData = await projectsResponse.json();
      setTasks(tasksData);
      setProjects(projectsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  const handleDeleteClick = (task: Task) => {
    setDeleteConfirmation({
      isOpen: true,
      taskId: task.id,
      taskTitle: task.title,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.taskId) return;

    try {
      const response = await fetch(`/api/tasks/${deleteConfirmation.taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setDeleteConfirmation({ isOpen: false, taskId: null, taskTitle: '' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, taskId: null, taskTitle: '' });
  };

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading Tasks...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <h3>Error Loading Tasks</h3>
        <p>Failed to load tasks. Please refresh the page.</p>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Tasks Found</h3>
        <p>Click &quot;Add Task&quot; to create your first task.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle>{task.title}</CardTitle>
                  <CardDescription>
                    {projectMap.get(task.projectId) || 'Unknown Project'}
                  </CardDescription>
                </div>
                <Badge variant={task.status === 'completed' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}>
                  {task.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {task.description && (
                <p className="text-sm">
                  <span className="font-medium">Description:</span> {task.description}
                </p>
              )}
              {task.assignedTo && (
                <p className="text-sm">
                  <span className="font-medium">Assigned To:</span> {task.assignedTo}
                </p>
              )}
              {task.dueDate && (
                <p className="text-sm">
                  <span className="font-medium">Due Date:</span> {task.dueDate}
                </p>
              )}
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                variant="secondary"
                icon="edit"
                data-action="edit"
                data-entity="task"
                data-id={task.id}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                icon="trash"
                onClick={() => handleDeleteClick(task)}
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
        entityName={deleteConfirmation.taskTitle}
        entityType="Task"
        variant="danger"
      />
    </>
  );
}
