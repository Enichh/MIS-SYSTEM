import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteProject } from './projectService';
import { deleteFromDatabase } from '@/lib/utils/database';

// Mock the database utility
vi.mock('@/lib/utils/database', () => ({
  deleteFromDatabase: vi.fn(),
}));

describe('projectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteProject', () => {
    it('should call deleteFromDatabase with correct table name and id', async () => {
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

      vi.mocked(deleteFromDatabase).mockResolvedValue(mockProject);

      const result = await deleteProject('456');

      expect(deleteFromDatabase).toHaveBeenCalledWith('projects', '456');
      expect(result).toEqual(mockProject);
    });

    it('should propagate errors from deleteFromDatabase', async () => {
      const mockError = new Error('Database connection failed');
      vi.mocked(deleteFromDatabase).mockRejectedValue(mockError);

      await expect(deleteProject('456')).rejects.toThrow('Database connection failed');
    });

    it('should handle empty id gracefully', async () => {
      const mockError = new Error('Failed to delete from projects: Invalid id');
      vi.mocked(deleteFromDatabase).mockRejectedValue(mockError);

      await expect(deleteProject('')).rejects.toThrow();
    });
  });
});
