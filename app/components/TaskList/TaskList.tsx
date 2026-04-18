'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Task, Project, SearchQuery } from '@/types';
import { Button } from '@/app/components/ui/Button/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/components/ui/Card/Card';
import { Badge } from '@/app/components/ui/Badge/Badge';
import DeleteConfirmation from '@/app/components/confirmation/DeleteConfirmation/DeleteConfirmation';
import { SearchBar } from '@/app/components/SearchBar/SearchBar';

interface TaskListProps {
  isActive?: boolean;
}

export default function TaskList({ isActive = true }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    taskId: string | null;
    taskTitle: string;
  }>({
    isOpen: false,
    taskId: null,
    taskTitle: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const tasksUrl = searchQuery ? `/api/tasks?name=${encodeURIComponent(searchQuery)}` : '/api/tasks';
      const [tasksResponse, projectsResponse] = await Promise.all([
        fetch(tasksUrl),
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
  }, [searchQuery]);

  useEffect(() => {
    if (isActive) {
      loadData();
    }
  }, [isActive, loadData]);

  const handleSearch = useCallback((query: SearchQuery) => {
    setSearchQuery(query.query);
  }, []);

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

  return (
    <>
      <SearchBar
        entityType="tasks"
        onSearch={handleSearch}
        placeholder="Search tasks by title..."
        ariaLabel="Search tasks"
      />
      {!tasks || tasks.length === 0 ? (
        <div className="empty-state">
          <h3>No Tasks Found</h3>
          <p>Click &quot;Add Task&quot; to create your first task.</p>
        </div>
      ) : (
        <div className="grid-layout">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex-between-start">
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
                  <span className="font-semibold">Description:</span> {task.description}
                </p>
              )}
              {task.assignedTo && (
                <p className="text-sm">
                  <span className="font-semibold">Assigned To:</span> {task.assignedTo}
                </p>
              )}
              {task.dueDate && (
                <p className="text-sm">
                  <span className="font-semibold">Due Date:</span> {task.dueDate}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex-between-end">
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
      )}
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
