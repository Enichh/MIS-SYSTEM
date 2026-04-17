'use client';

import { useState, useEffect } from 'react';
import type { Task, Project } from '@/types';
import { getTasks } from '@/lib/services/taskService';
import { getProjects } from '@/lib/services/projectService';
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
      const [tasksData, projectsData] = await Promise.all([getTasks(), getProjects()]);
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
                onClick={() => handleDeleteClick(task)}
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
        entityName={deleteConfirmation.taskTitle}
        entityType="Task"
        variant="danger"
      />
    </>
  );
}
