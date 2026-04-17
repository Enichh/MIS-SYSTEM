import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from 'next/server';
import { NextRequest } from 'next/server';
import { deleteEmployee } from '@/lib/services/employeeService';
import { handleApiError } from '@/lib/utils/api-handler';

// Mock the service and utility functions
vi.mock('@/lib/services/employeeService', () => ({
  deleteEmployee: vi.fn(),
}));

vi.mock('@/lib/utils/api-handler', () => ({
  handleApiError: vi.fn(),
}));

// Import the route handler after mocking
import { DELETE as deleteHandler } from './route';

describe('DELETE /api/employees/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete employee successfully with valid id', async () => {
    const mockEmployee = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Developer',
      department: 'Engineering',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(deleteEmployee).mockResolvedValue(mockEmployee);
    vi.mocked(handleApiError).mockImplementation((error) => {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    });

    const request = new NextRequest('http://localhost:3000/api/employees/123', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: '123' });

    const response = await deleteHandler(request, { params });

    expect(deleteEmployee).toHaveBeenCalledWith('123');
    expect(response.status).toBe(200);
  });

  it('should return 400 when id is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/employees/', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: '' });

    const response = await deleteHandler(request, { params });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Employee ID is required');
  });

  it('should handle errors from deleteEmployee', async () => {
    const mockError = new Error('Employee not found');
    vi.mocked(deleteEmployee).mockRejectedValue(mockError);
    vi.mocked(handleApiError).mockReturnValue(
      new Response(JSON.stringify({ error: 'Employee not found' }), { status: 404 })
    );

    const request = new NextRequest('http://localhost:3000/api/employees/123', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: '123' });

    const response = await deleteHandler(request, { params });

    expect(handleApiError).toHaveBeenCalledWith(mockError);
  });
});
