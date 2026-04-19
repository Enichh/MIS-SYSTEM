import { z } from 'zod';

export const EmployeeSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Department is required'),
  skills: z.array(z.string()).default([]),
  embedding: z.array(z.number()).nullable().optional(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const ProjectSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'on_hold']),
  priority: z.enum(['high', 'medium', 'low']),
  progress: z.number().int().min(0).max(100).default(0),
  startdate: z.string().optional(),
  enddate: z.string().optional(),
  embedding: z.array(z.number()).nullable().optional(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const TaskSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['completed', 'in_progress', 'pending']),
  priority: z.enum(['high', 'medium', 'low']),
  dependencies: z.array(z.string()).default([]),
  projectid: z.string().uuid('Project ID must be a valid UUID'),
  assignedto: z.string().uuid().nullable(),
  duedate: z.string().optional(),
  embedding: z.array(z.number()).nullable().optional(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const EmployeeProjectSchema = z.object({
  employee_id: z.string().uuid('Employee ID must be a valid UUID'),
  project_id: z.string().uuid('Project ID must be a valid UUID'),
  created_at: z.string().nullable(),
});

export const AdminSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
  email: z.string().email('Invalid email format'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'super_admin']).default('admin'),
  is_active: z.boolean().default(true),
  last_login_at: z.string().nullable().optional(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
