import { NextRequest, NextResponse } from 'next/server';
import { backfillEmployeeEmbeddings, backfillProjectEmbeddings, backfillTaskEmbeddings } from '@/lib/utils/embeddings';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/backfill-embeddings
 * 
 * Backfill embeddings for employees, projects, and/or tasks
 * Body: { types: ('employees' | 'projects' | 'tasks')[], batchSize?: number }
 * 
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Verify user is an admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { types = ['employees'], batchSize = 10 } = body;

    const results: Record<string, { success: number; failed: number; total: number }> = {};

    // Backfill employees
    if (types.includes('employees')) {
      console.log('Starting employee embedding backfill...');
      results.employees = await backfillEmployeeEmbeddings({ batchSize });
    }

    // Backfill projects
    if (types.includes('projects')) {
      console.log('Starting project embedding backfill...');
      results.projects = await backfillProjectEmbeddings({ batchSize });
    }

    // Backfill tasks
    if (types.includes('tasks')) {
      console.log('Starting task embedding backfill...');
      results.tasks = await backfillTaskEmbeddings({ batchSize });
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Embedding backfill completed',
    });

  } catch (error) {
    console.error('Backfill failed:', error);
    return NextResponse.json(
      { 
        error: 'Backfill failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/backfill-embeddings
 * 
 * Check embedding population status
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check employee embedding status
    const { data: employeeStats } = await supabase
      .from('employees')
      .select('embedding', { count: 'exact' })
      .not('embedding', 'is', null);

    const { count: totalEmployees } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    // Check project embedding status
    const { data: projectStats } = await supabase
      .from('projects')
      .select('embedding', { count: 'exact' })
      .not('embedding', 'is', null);

    const { count: totalProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    // Check task embedding status
    const { data: taskStats } = await supabase
      .from('tasks')
      .select('embedding', { count: 'exact' })
      .not('embedding', 'is', null);

    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      employees: {
        withEmbeddings: employeeStats?.length || 0,
        total: totalEmployees || 0,
        percentage: totalEmployees 
          ? Math.round(((employeeStats?.length || 0) / totalEmployees) * 100) 
          : 0,
      },
      projects: {
        withEmbeddings: projectStats?.length || 0,
        total: totalProjects || 0,
        percentage: totalProjects
          ? Math.round(((projectStats?.length || 0) / totalProjects) * 100)
          : 0,
      },
      tasks: {
        withEmbeddings: taskStats?.length || 0,
        total: totalTasks || 0,
        percentage: totalTasks
          ? Math.round(((taskStats?.length || 0) / totalTasks) * 100)
          : 0,
      },
    });

  } catch (error) {
    console.error('Status check failed:', error);
    return NextResponse.json(
      { 
        error: 'Status check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
