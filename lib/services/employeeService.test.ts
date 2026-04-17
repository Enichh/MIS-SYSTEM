import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteEmployee } from './employeeService';
import { deleteFromDatabase } from '@/lib/utils/database';

// Mock the database utility
vi.mock('@/lib/utils/database', () => ({
  deleteFromDatabase: vi.fn(),
}));

describe('employeeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteEmployee', () => {
    it('should call deleteFromDatabase with correct table name and id', async () => {
      const mockEmployee = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Developer',
        department: 'Engineering',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(deleteFromDatabase).mockResolvedValue(mockEmployee);

      const result = await deleteEmployee('123');

      expect(deleteFromDatabase).toHaveBeenCalledWith('employees', '123');
      expect(result).toEqual(mockEmployee);
    });

    it('should propagate errors from deleteFromDatabase', async () => {
      const mockError = new Error('Database connection failed');
      vi.mocked(deleteFromDatabase).mockRejectedValue(mockError);

      await expect(deleteEmployee('123')).rejects.toThrow('Database connection failed');
    });

    it('should handle empty id gracefully', async () => {
      const mockError = new Error('Failed to delete from employees: Invalid id');
      vi.mocked(deleteFromDatabase).mockRejectedValue(mockError);

      await expect(deleteEmployee('')).rejects.toThrow();
    });
  });
});
