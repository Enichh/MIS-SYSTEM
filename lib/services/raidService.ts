import { fetchFromDatabase, insertToDatabase, updateToDatabase, deleteFromDatabase } from '@/lib/utils/database';
import { RaidItem, RaidType } from '@/types';

/**
 * RaidService handles Risk, Action Item, Issue, and Decision Point management.
 * Follows SOLID by providing specialized logic for RAID items while keeping database logic separate.
 */
export class RaidService {
  /**
   * Fetches RAID items for a project, optionally filtered by type
   */
  static async getProjectRaid(projectId: string, type?: RaidType): Promise<RaidItem[]> {
    const filters: Record<string, any> = { project_id: projectId };
    if (type) filters.type = type;
    return fetchFromDatabase<RaidItem>('raid_items', filters);
  }

  /**
   * Creates a new RAID item
   */
  static async createRaidItem(data: Omit<RaidItem, 'id' | 'created_at' | 'updated_at'>): Promise<RaidItem> {
    return insertToDatabase<RaidItem>('raid_items', data as any);
  }

  /**
   * Updates a RAID item
   */
  static async updateRaidItem(id: string, updates: Partial<RaidItem>): Promise<RaidItem> {
    return updateToDatabase<RaidItem>('raid_items', id, updates as any);
  }

  /**
   * Closes or resolves a RAID item
   */
  static async resolveRaidItem(id: string, resolution: string): Promise<RaidItem> {
    return this.updateRaidItem(id, { 
      status: 'closed',
      description: `${resolution} (Resolved)` // Simple implementation, could be expanded
    } as any);
  }
}
