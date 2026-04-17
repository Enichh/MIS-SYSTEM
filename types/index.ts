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
  assignedTo: string | null;
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
  type: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select';
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
