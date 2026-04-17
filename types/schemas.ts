import { z } from 'zod';

export const EmployeeSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Department is required'),
  skills: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ProjectSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  status: z.enum(['active', 'completed', 'on_hold']),
  priority: z.enum(['high', 'medium', 'low']),
  progress: z.number().int().min(0).max(100).default(0),
  startDate: z.string(),
  endDate: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const TaskSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  status: z.enum(['completed', 'in_progress', 'pending']),
  priority: z.enum(['high', 'medium', 'low']),
  dependencies: z.array(z.string()).default([]),
  projectId: z.string().uuid('Project ID must be a valid UUID'),
  assignedTo: z.string().uuid().nullable(),
  dueDate: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const EmployeeProjectSchema = z.object({
  employee_id: z.string().uuid('Employee ID must be a valid UUID'),
  project_id: z.string().uuid('Project ID must be a valid UUID'),
  created_at: z.string(),
});
