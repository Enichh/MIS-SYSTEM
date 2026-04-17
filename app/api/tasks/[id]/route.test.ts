import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { deleteTask } from '@/lib/services/taskService';
import { handleApiError } from '@/lib/utils/api-handler';

// Mock the service and utility functions
vi.mock('@/lib/services/taskService', () => ({
  deleteTask: vi.fn(),
}));

vi.mock('@/lib/utils/api-handler', () => ({
  handleApiError: vi.fn(),
}));

// Import the route handler after mocking
import { DELETE as deleteHandler } from '../app/api/tasks/[id]/route';

describe('DELETE /api/tasks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete task successfully with valid id', async () => {
    const mockTask = {
      id: '789',
      title: 'Test Task',
      description: 'A test task',
      status: 'pending',
      priority: 'medium',
      projectId: '456',
      assignedTo: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(deleteTask).mockResolvedValue(mockTask);
    vi.mocked(handleApiError).mockImplementation((error) => {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    });

    const request = new NextRequest('http://localhost:3000/api/tasks/789', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: '789' });

    const response = await deleteHandler(request, { params });

    expect(deleteTask).toHaveBeenCalledWith('789');
    expect(response.status).toBe(200);
  });

  it('should return 400 when id is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks/', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: '' });

    const response = await deleteHandler(request, { params });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Task ID is required');
  });

  it('should handle errors from deleteTask', async () => {
    const mockError = new Error('Task not found');
    vi.mocked(deleteTask).mockRejectedValue(mockError);
    vi.mocked(handleApiError).mockReturnValue(
      new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 })
    );

    const request = new NextRequest('http://localhost:3000/api/tasks/789', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: '789' });

    const response = await deleteHandler(request, { params });

    expect(handleApiError).toHaveBeenCalledWith(mockError);
  });
});
