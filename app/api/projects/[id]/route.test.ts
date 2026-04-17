import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { deleteProject } from '@/lib/services/projectService';
import { handleApiError } from '@/lib/utils/api-handler';

// Mock the service and utility functions
vi.mock('@/lib/services/projectService', () => ({
  deleteProject: vi.fn(),
}));

vi.mock('@/lib/utils/api-handler', () => ({
  handleApiError: vi.fn(),
}));

// Import the route handler after mocking
import { DELETE as deleteHandler } from './route';

describe('DELETE /api/projects/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete project successfully with valid id', async () => {
    const mockProject = {
      id: '456',
      name: 'Test Project',
      description: 'A test project',
      status: 'active',
      priority: 'medium',
      progress: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(deleteProject).mockResolvedValue(mockProject);
    vi.mocked(handleApiError).mockImplementation((error) => {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    });

    const request = new NextRequest('http://localhost:3000/api/projects/456', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: '456' });

    const response = await deleteHandler(request, { params });

    expect(deleteProject).toHaveBeenCalledWith('456');
    expect(response.status).toBe(200);
  });

  it('should return 400 when id is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/projects/', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: '' });

    const response = await deleteHandler(request, { params });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Project ID is required');
  });

  it('should handle errors from deleteProject', async () => {
    const mockError = new Error('Project not found');
    vi.mocked(deleteProject).mockRejectedValue(mockError);
    vi.mocked(handleApiError).mockReturnValue(
      new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 })
    );

    const request = new NextRequest('http://localhost:3000/api/projects/456', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: '456' });

    const response = await deleteHandler(request, { params });

    expect(handleApiError).toHaveBeenCalledWith(mockError);
  });
});
