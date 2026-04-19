export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  skills: string[];
  embedding?: number[];
  created_at: string | null;
  updated_at: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold';
  priority: 'high' | 'medium' | 'low';
  progress: number;
  startdate?: string;
  enddate?: string;
  embedding?: number[];
  created_at: string | null;
  updated_at: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'in_progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
  projectid: string;
  assignedto: string | null;
  duedate?: string;
  embedding?: number[];
  created_at: string | null;
  updated_at: string | null;
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
  created_at: string | null;
}

export interface Admin {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalConfig {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  ariaLabelledBy?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  initialFocus?: string;
  returnFocus?: boolean;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select' | 'searchable';
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: Record<string, unknown>;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface ConfirmationConfig {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  ariaLabelledBy?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  initialFocus?: string;
}

export interface SearchQuery {
  query: string;
  entityType: 'employees' | 'projects' | 'tasks';
}

export interface SearchFilters {
  name?: string;
  status?: string;
  projectId?: string;
  assignedTo?: string;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
}

export * from './auth';
export * from '../lib/types/reports';
