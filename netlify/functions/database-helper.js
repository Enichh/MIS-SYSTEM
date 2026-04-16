async function fetchFromDatabase(storeName, filters = {}) {
  const mockData = {
    projects: [
      {
        id: 'proj-001',
        name: 'Website Redesign',
        description: 'Complete overhaul of company website',
        status: 'active',
        startDate: '2024-01-15',
        endDate: '2024-06-30'
      },
      {
        id: 'proj-002',
        name: 'Mobile App Development',
        description: 'Native iOS and Android application',
        status: 'active',
        startDate: '2024-02-01',
        endDate: '2024-08-31'
      },
      {
        id: 'proj-003',
        name: 'Database Migration',
        description: 'Migrate legacy database to cloud',
        status: 'completed',
        startDate: '2023-11-01',
        endDate: '2024-01-31'
      }
    ],
    employees: [
      {
        id: 'emp-001',
        name: 'John Smith',
        email: 'john.smith@company.com',
        role: 'Senior Developer',
        department: 'Engineering',
        projects: ['proj-001', 'proj-002']
      },
      {
        id: 'emp-002',
        name: 'Jane Doe',
        email: 'jane.doe@company.com',
        role: 'Project Manager',
        department: 'Operations',
        projects: ['proj-001', 'proj-003']
      },
      {
        id: 'emp-003',
        name: 'Bob Johnson',
        email: 'bob.johnson@company.com',
        role: 'Database Administrator',
        department: 'Engineering',
        projects: ['proj-003']
      }
    ],
    tasks: [
      {
        id: 'task-001',
        title: 'Design homepage mockup',
        description: 'Create initial design concepts for homepage',
        status: 'completed',
        projectId: 'proj-001',
        assignedTo: 'emp-001',
        dueDate: '2024-02-15'
      },
      {
        id: 'task-002',
        title: 'Implement user authentication',
        description: 'Add login and registration functionality',
        status: 'in_progress',
        projectId: 'proj-002',
        assignedTo: 'emp-001',
        dueDate: '2024-05-30'
      },
      {
        id: 'task-003',
        title: 'Backup existing database',
        description: 'Create full backup before migration',
        status: 'completed',
        projectId: 'proj-003',
        assignedTo: 'emp-003',
        dueDate: '2023-12-15'
      }
    ]
  };

  let data = mockData[storeName] || [];
  
  if (filters.id) {
    data = data.filter(item => item.id === filters.id);
  }
  if (filters.status) {
    data = data.filter(item => item.status === filters.status);
  }
  if (filters.projectId) {
    data = data.filter(item => item.projectId === filters.projectId);
  }
  if (filters.assignedTo) {
    data = data.filter(item => item.assignedTo === filters.assignedTo);
  }
  
  return data;
}

module.exports = { fetchFromDatabase };
