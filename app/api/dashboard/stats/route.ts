import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/utils/api-handler';

export const dynamic = 'force-dynamic';

export interface DashboardStatsResponse {
  employees: {
    total: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    highPriority: number;
  };
  recentActivity: {
    id: string;
    type: 'employee' | 'project' | 'task';
    title: string;
    description: string;
    timestamp: string;
  }[];
  priorityItems: {
    id: string;
    type: 'task' | 'project';
    title: string;
    priority: 'high' | 'medium' | 'low';
    meta: string;
  }[];
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all counts in parallel using Supabase count
    const [
      employeesResult,
      projectsResult,
      tasksResult,
      activeProjectsResult,
      completedProjectsResult,
      onHoldProjectsResult,
      completedTasksResult,
      inProgressTasksResult,
      pendingTasksResult,
      highPriorityTasksResult,
    ] = await Promise.all([
      // Total counts
      supabase.from('employees').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      // Project status counts
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'on_hold'),
      // Task status counts
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('priority', 'high'),
    ]);

    // Fetch recent activity (projects and tasks ordered by updated_at)
    const [recentProjects, recentTasks] = await Promise.all([
      supabase
        .from('projects')
        .select('id, name, status, updated_at')
        .order('updated_at', { ascending: false })
        .limit(3),
      supabase
        .from('tasks')
        .select('id, title, status, updated_at')
        .order('updated_at', { ascending: false })
        .limit(3),
    ]);

    // Fetch priority items (high priority tasks and projects)
    const [priorityTasks, priorityProjects] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, priority, duedate, status')
        .eq('priority', 'high')
        .neq('status', 'completed')
        .order('duedate', { ascending: true })
        .limit(3),
      supabase
        .from('projects')
        .select('id, name, priority, progress, status')
        .eq('priority', 'high')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(2),
    ]);

    // Build recent activity array
    const recentActivity: DashboardStatsResponse['recentActivity'] = [
      ...(recentProjects.data || []).map((p) => ({
        id: p.id,
        type: 'project' as const,
        title: p.name,
        description: `Project ${p.status.replace('_', ' ')}`,
        timestamp: p.updated_at,
      })),
      ...(recentTasks.data || []).map((t) => ({
        id: t.id,
        type: 'task' as const,
        title: t.title,
        description: `Task ${t.status.replace('_', ' ')}`,
        timestamp: t.updated_at,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    // Build priority items array
    const priorityItems: DashboardStatsResponse['priorityItems'] = [
      ...(priorityTasks.data || []).map((t) => ({
        id: t.id,
        type: 'task' as const,
        title: t.title,
        priority: t.priority as 'high' | 'medium' | 'low',
        meta: `Due: ${t.duedate || 'No due date'}`,
      })),
      ...(priorityProjects.data || []).map((p) => ({
        id: p.id,
        type: 'project' as const,
        title: p.name,
        priority: p.priority as 'high' | 'medium' | 'low',
        meta: `${p.progress}% complete`,
      })),
    ].slice(0, 5);

    const stats: DashboardStatsResponse = {
      employees: {
        total: employeesResult.count || 0,
      },
      projects: {
        total: projectsResult.count || 0,
        active: activeProjectsResult.count || 0,
        completed: completedProjectsResult.count || 0,
        onHold: onHoldProjectsResult.count || 0,
      },
      tasks: {
        total: tasksResult.count || 0,
        completed: completedTasksResult.count || 0,
        inProgress: inProgressTasksResult.count || 0,
        pending: pendingTasksResult.count || 0,
        highPriority: highPriorityTasksResult.count || 0,
      },
      recentActivity,
      priorityItems,
    };

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
