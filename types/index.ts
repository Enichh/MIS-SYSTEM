export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  projects?: string[];
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on_hold';
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  projectId: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
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
