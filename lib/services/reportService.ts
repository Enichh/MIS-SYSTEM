import { fetchFromDatabase } from '@/lib/utils/database';
import type { ReportType, ReportData, ReportConfig } from '@/lib/types/reports';
import { validateReportType } from '@/lib/utils/report-utils';

interface ReportError {
  message: string;
  code: string;
  type: ReportType;
}

async function generateEmployeeSummary(config: ReportConfig): Promise<ReportData> {
  const isFullDetails = config.includeFullDetails ?? false;
  const pagination = config.pagination ?? { page: 1, limit: 50 };

  // For summary mode, fetch all data for metrics but limit detail sections
  // For full details mode, use pagination
  const employees = await fetchFromDatabase('employees', {
    ...config.filters,
    ...pagination
  }, { skipPagination: !isFullDetails });

  const projects = await fetchFromDatabase('projects', config.filters, { skipPagination: true });

  const totalEmployees = employees.length;
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;
  const totalProjects = projects.length;

  const sections: ReportData['sections'] = [
    {
      title: 'Employee Overview',
      content: `Total employees: ${totalEmployees}. Active projects: ${activeProjects} of ${totalProjects}.`,
      order: 1
    }
  ];

  // Only include detailed employee list in full details mode
  if (isFullDetails) {
    const departmentBreakdown = employees.map((e: any) => ({
      name: e.name,
      department: e.department,
      role: e.role,
      email: e.email
    }));

    sections.push({
      title: 'Department Breakdown',
      content: JSON.stringify(departmentBreakdown), // Store as structured data for PDF table rendering
      order: 2
    });

    sections.push({
      title: 'Pagination Info',
      content: `Showing ${employees.length} employees (Page ${pagination.page})`,
      order: 3
    });
  } else {
    // Summary mode: just show department counts
    const deptCounts = employees.reduce((acc: Record<string, number>, e: any) => {
      acc[e.department] = (acc[e.department] || 0) + 1;
      return acc;
    }, {});

    sections.push({
      title: 'Department Breakdown',
      content: Object.entries(deptCounts)
        .map(([dept, count]) => `${dept}: ${count} employees`)
        .join('\n'),
      order: 2
    });
  }

  const metrics: ReportData['metrics'] = [
    { label: 'Total Employees', value: totalEmployees, unit: 'people' },
    { label: 'Active Projects', value: activeProjects, unit: 'projects' },
    { label: 'Total Projects', value: totalProjects, unit: 'projects' }
  ];

  const charts: ReportData['charts'] = config.includeCharts ? [
    {
      type: 'bar',
      title: 'Employees by Department',
      data: {
        labels: employees.map((e: any) => e.department),
        values: employees.map((e: any) => 1)
      }
    }
  ] : [];

  return {
    title: 'Employee Summary Report',
    type: 'employee_summary',
    generatedAt: new Date().toISOString(),
    sections,
    metrics: config.includeMetrics ? metrics : [],
    charts,
    metadata: {
      employeeCount: totalEmployees,
      projectCount: totalProjects,
      isFullDetails,
      pagination: isFullDetails ? pagination : undefined
    }
  };
}

async function generateProjectStatus(config: ReportConfig): Promise<ReportData> {
  const projects = await fetchFromDatabase('projects', config.filters);
  const tasks = await fetchFromDatabase('tasks', config.filters);
  
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;
  const completedProjects = projects.filter((p: any) => p.status === 'completed').length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
  
  const sections: ReportData['sections'] = [
    {
      title: 'Project Status Overview',
      content: `Active projects: ${activeProjects}. Completed projects: ${completedProjects}.`,
      order: 1
    },
    {
      title: 'Task Progress',
      content: `Completed tasks: ${completedTasks} of ${totalTasks} (${Math.round(completedTasks / totalTasks * 100)}%).`,
      order: 2
    }
  ];
  
  const metrics: ReportData['metrics'] = [
    { label: 'Active Projects', value: activeProjects, unit: 'projects' },
    { label: 'Completed Projects', value: completedProjects, unit: 'projects' },
    { label: 'Task Completion Rate', value: Math.round(completedTasks / totalTasks * 100), unit: '%' }
  ];
  
  const charts: ReportData['charts'] = config.includeCharts ? [
    {
      type: 'pie',
      title: 'Project Status Distribution',
      data: {
        labels: ['Active', 'Completed', 'Other'],
        values: [activeProjects, completedProjects, projects.length - activeProjects - completedProjects]
      }
    }
  ] : [];
  
  return {
    title: 'Project Status Report',
    type: 'project_status',
    generatedAt: new Date().toISOString(),
    sections,
    metrics: config.includeMetrics ? metrics : [],
    charts,
    metadata: { projectCount: projects.length, taskCount: totalTasks }
  };
}

async function generateTaskOverview(config: ReportConfig): Promise<ReportData> {
  const tasks = await fetchFromDatabase('tasks', config.filters);
  
  const pendingTasks = tasks.filter((t: any) => t.status === 'pending').length;
  const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').length;
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
  const overdueTasks = tasks.filter((t: any) => {
    const dueDate = new Date(t.duedate);
    return dueDate < new Date() && t.status !== 'completed';
  }).length;
  
  const sections: ReportData['sections'] = [
    {
      title: 'Task Status Breakdown',
      content: `Pending: ${pendingTasks}, In Progress: ${inProgressTasks}, Completed: ${completedTasks}.`,
      order: 1
    },
    {
      title: 'Overdue Tasks',
      content: overdueTasks > 0 ? `${overdueTasks} tasks are overdue.` : 'No overdue tasks.',
      order: 2
    }
  ];
  
  const metrics: ReportData['metrics'] = [
    { label: 'Pending Tasks', value: pendingTasks, unit: 'tasks' },
    { label: 'In Progress', value: inProgressTasks, unit: 'tasks' },
    { label: 'Completed', value: completedTasks, unit: 'tasks' },
    { label: 'Overdue', value: overdueTasks, unit: 'tasks' }
  ];
  
  const charts: ReportData['charts'] = config.includeCharts ? [
    {
      type: 'bar',
      title: 'Task Status Distribution',
      data: {
        labels: ['Pending', 'In Progress', 'Completed', 'Overdue'],
        values: [pendingTasks, inProgressTasks, completedTasks, overdueTasks]
      }
    }
  ] : [];
  
  return {
    title: 'Task Overview Report',
    type: 'task_overview',
    generatedAt: new Date().toISOString(),
    sections,
    metrics: config.includeMetrics ? metrics : [],
    charts,
    metadata: { taskCount: tasks.length, overdueCount: overdueTasks }
  };
}

async function generateWorkloadAnalysis(config: ReportConfig): Promise<ReportData> {
  const isFullDetails = config.includeFullDetails ?? false;
  const pagination = config.pagination ?? { page: 1, limit: 50 };

  const employees = await fetchFromDatabase('employees', {
    ...config.filters,
    ...pagination
  }, { skipPagination: !isFullDetails });

  const tasks = await fetchFromDatabase('tasks', config.filters, { skipPagination: true });
  const employeeProjects = await fetchFromDatabase('employee_projects', config.filters, { skipPagination: true });

  const workloadByEmployee = employees.map((e: any) => {
    const assignedTasks = tasks.filter((t: any) => t.assignedto === e.id);
    const projectCount = employeeProjects.filter((ep: any) => ep.employee_id === e.id).length;
    return {
      name: e.name,
      department: e.department,
      role: e.role,
      taskCount: assignedTasks.length,
      projectCount
    };
  });

  const avgTasksPerEmployee = tasks.length / employees.length;
  const maxWorkload = Math.max(...workloadByEmployee.map((w: any) => w.taskCount));
  const minWorkload = Math.min(...workloadByEmployee.map((w: any) => w.taskCount));

  const sections: ReportData['sections'] = [
    {
      title: 'Workload Distribution',
      content: `Average tasks per employee: ${avgTasksPerEmployee.toFixed(1)}. Max: ${maxWorkload}, Min: ${minWorkload}.`,
      order: 1
    }
  ];

  // Only include detailed employee workload list in full details mode
  if (isFullDetails) {
    sections.push({
      title: 'Employee Workload Details',
      content: JSON.stringify(workloadByEmployee), // Store as structured data for PDF table rendering
      order: 2
    });

    sections.push({
      title: 'Pagination Info',
      content: `Showing ${workloadByEmployee.length} employees (Page ${pagination.page})`,
      order: 3
    });
  } else {
    // Summary mode: show top 5 and bottom 5 workloads
    const sortedByWorkload = [...workloadByEmployee].sort((a, b) => b.taskCount - a.taskCount);
    const topWorkload = sortedByWorkload.slice(0, 5);
    const bottomWorkload = sortedByWorkload.slice(-5);

    sections.push({
      title: 'Top 5 Workloads',
      content: topWorkload.map((w: any) => `${w.name}: ${w.taskCount} tasks`).join('\n'),
      order: 2
    });

    sections.push({
      title: 'Bottom 5 Workloads',
      content: bottomWorkload.map((w: any) => `${w.name}: ${w.taskCount} tasks`).join('\n'),
      order: 3
    });
  }

  const metrics: ReportData['metrics'] = [
    { label: 'Avg Tasks/Employee', value: avgTasksPerEmployee.toFixed(1), unit: 'tasks' },
    { label: 'Max Workload', value: maxWorkload, unit: 'tasks' },
    { label: 'Min Workload', value: minWorkload, unit: 'tasks' }
  ];

  const charts: ReportData['charts'] = config.includeCharts ? [
    {
      type: 'bar',
      title: 'Tasks per Employee',
      data: {
        labels: workloadByEmployee.map((w: any) => w.name),
        values: workloadByEmployee.map((w: any) => w.taskCount)
      }
    }
  ] : [];

  return {
    title: 'Workload Analysis Report',
    type: 'workload_analysis',
    generatedAt: new Date().toISOString(),
    sections,
    metrics: config.includeMetrics ? metrics : [],
    charts,
    metadata: {
      employeeCount: employees.length,
      avgWorkload: avgTasksPerEmployee,
      isFullDetails,
      pagination: isFullDetails ? pagination : undefined
    }
  };
}

function formatDataAsText(data: any[]): string {
  if (data.length === 0) return 'No data available.';
  
  return data.slice(0, 5).map((item, index) => {
    const keys = Object.keys(item);
    const lines = keys.map(key => {
      const value = Array.isArray(item[key]) 
        ? `[${item[key].join(', ')}]` 
        : String(item[key]);
      return `  ${key}: ${value}`;
    });
    return `Record ${index + 1}:\n${lines.join('\n')}`;
  }).join('\n\n');
}

async function generateCustomReport(config: ReportConfig): Promise<ReportData> {
  const { filters } = config;
  
  let data: any[] = [];
  let dataSource = '';
  
  if (filters?.table) {
    data = await fetchFromDatabase(filters.table as string, filters);
    dataSource = filters.table as string;
  } else {
    data = await fetchFromDatabase('employees', filters);
    dataSource = 'employees';
  }
  
  const sections: ReportData['sections'] = [
    {
      title: 'Custom Report Data',
      content: `Data source: ${dataSource}. Total records: ${data.length}.`,
      order: 1
    },
    {
      title: 'Data Summary',
      content: formatDataAsText(data),
      order: 2
    }
  ];
  
  const metrics: ReportData['metrics'] = [
    { label: 'Total Records', value: data.length, unit: 'records' },
    { label: 'Data Source', value: dataSource }
  ];
  
  const charts: ReportData['charts'] = config.includeCharts ? [
    {
      type: 'table',
      title: 'Data Preview',
      data: {
        headers: Object.keys(data[0] || {}),
        rows: data.slice(0, 10).map((item: any) => Object.values(item))
      }
    }
  ] : [];
  
  return {
    title: 'Custom Report',
    type: 'custom',
    generatedAt: new Date().toISOString(),
    sections,
    metrics: config.includeMetrics ? metrics : [],
    charts,
    metadata: { dataSource, recordCount: data.length, filters }
  };
}

export async function generateReportData(config: ReportConfig): Promise<ReportData> {
  if (!validateReportType(config.type)) {
    const error: ReportError = {
      message: `Invalid report type: ${config.type}`,
      code: 'INVALID_REPORT_TYPE',
      type: config.type
    };
    throw new Error(error.message);
  }
  
  try {
    switch (config.type) {
      case 'employee_summary':
        return await generateEmployeeSummary(config);
      case 'project_status':
        return await generateProjectStatus(config);
      case 'task_overview':
        return await generateTaskOverview(config);
      case 'workload_analysis':
        return await generateWorkloadAnalysis(config);
      case 'custom':
        return await generateCustomReport(config);
      default:
        const error: ReportError = {
          message: `Unsupported report type: ${config.type}`,
          code: 'UNSUPPORTED_REPORT_TYPE',
          type: config.type
        };
        throw new Error(error.message);
    }
  } catch (error) {
    console.error('Report generation error:', error);
    throw new Error(`Failed to generate ${config.type} report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
