import { fetchFromDatabase, insertToDatabase, updateToDatabase, deleteFromDatabase } from '@/lib/utils/database';
import { Milestone, Project } from '@/types';

/**
 * MilestoneService handles the lifecycle of project milestones.
 * Adheres to the Single Responsibility Principle by focusing only on milestone-related logic.
 */
export class MilestoneService {
  /**
   * Fetches all milestones for a project, sorted by order_index
   */
  static async getProjectMilestones(projectId: string): Promise<Milestone[]> {
    const milestones = await fetchFromDatabase<Milestone>('milestones', { project_id: projectId });
    return milestones.sort((a, b) => a.order_index - b.order_index);
  }

  /**
   * Creates a new milestone
   */
  static async createMilestone(data: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>): Promise<Milestone> {
    return insertToDatabase<Milestone>('milestones', data as any);
  }

  /**
   * Updates a milestone's status and automatically calculates project progress
   */
  static async updateMilestoneStatus(milestoneId: string, status: Milestone['status']): Promise<Milestone> {
    const updates: Partial<Milestone> = { status };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    
    const milestone = await updateToDatabase<Milestone>('milestones', milestoneId, updates as any);
    
    // Auto-update project progress and current_milestone_id
    await this.syncProjectProgress(milestone.project_id);
    
    return milestone;
  }

  /**
   * Syncs the project's current milestone and progress percentage based on milestone statuses.
   * This logic is encapsulated here to maintain consistency.
   */
  private static async syncProjectProgress(projectId: string): Promise<void> {
    const milestones = await this.getProjectMilestones(projectId);
    if (milestones.length === 0) return;

    const completed = milestones.filter(m => m.status === 'completed');
    const current = milestones.find(m => m.status === 'current') || 
                  milestones.find(m => m.status === 'pending');

    const progress = Math.round((completed.length / milestones.length) * 100);

    await updateToDatabase<Project>('projects', projectId, {
      progress,
      current_milestone_id: current?.id || null
    } as any);
  }

  /**
   * Seeds standard milestones for a new project
   */
  static async seedStandardMilestones(projectId: string): Promise<void> {
    const standards = [
      'Kick Off', 'Development', 'UAT', 'NFT', 'Regression Testing',
      'Deployment Approvals', 'Deployment', 'Stabilization Period', 'Operations Turnover'
    ];

    for (let i = 0; i < standards.length; i++) {
      await this.createMilestone({
        project_id: projectId,
        name: standards[i],
        order_index: i + 1,
        status: i === 0 ? 'current' : 'pending'
      });
    }
    
    await this.syncProjectProgress(projectId);
  }
}
