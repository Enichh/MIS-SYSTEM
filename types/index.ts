export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  skills: string[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold';
  priority: 'high' | 'medium' | 'low';
  progress: number;
  startDate?: string;
  endDate?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'in_progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
  projectId: string;
  assignedTo?: string;
  dueDate?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse {
  code: string;
  message: string;
}

export interface KnowledgeQuery {
  query: string;
  context?: {
    employeeId?: string;
    projectId?: string;
    taskId?: string;
  };
}

export interface KnowledgeResponse {
  answer: string;
  sources: string[];
  confidence: number;
  relatedEntities: Record<string, unknown>;
}

export interface EmployeeProject {
  employee_id: string;
  project_id: string;
  created_at: string;
}
