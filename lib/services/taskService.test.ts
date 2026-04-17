import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteTask } from './taskService';
import { deleteFromDatabase } from '@/lib/utils/database';

// Mock the database utility
vi.mock('@/lib/utils/database', () => ({
  deleteFromDatabase: vi.fn(),
}));

describe('taskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteTask', () => {
    it('should call deleteFromDatabase with correct table name and id', async () => {
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

      vi.mocked(deleteFromDatabase).mockResolvedValue(mockTask);

      const result = await deleteTask('789');

      expect(deleteFromDatabase).toHaveBeenCalledWith('tasks', '789');
      expect(result).toEqual(mockTask);
    });

    it('should propagate errors from deleteFromDatabase', async () => {
      const mockError = new Error('Database connection failed');
      vi.mocked(deleteFromDatabase).mockRejectedValue(mockError);

      await expect(deleteTask('789')).rejects.toThrow('Database connection failed');
    });

    it('should handle empty id gracefully', async () => {
      const mockError = new Error('Failed to delete from tasks: Invalid id');
      vi.mocked(deleteFromDatabase).mockRejectedValue(mockError);

      await expect(deleteTask('')).rejects.toThrow();
    });
  });
});
