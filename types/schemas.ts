import { z } from 'zod';

export const EmployeeSchema = z.object({
  id: z.string().regex(/^emp-[0-9]{3}$/, 'ID must match pattern emp-XXX'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Department is required'),
  projects: z.array(z.string()).optional(),
});

export const ProjectSchema = z.object({
  id: z.string().regex(/^proj-[0-9]{3}$/, 'ID must match pattern proj-XXX'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'on_hold']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const TaskSchema = z.object({
  id: z.string().regex(/^task-[0-9]{3}$/, 'ID must match pattern task-XXX'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['completed', 'in_progress', 'pending']),
  projectId: z.string().min(1, 'Project ID is required'),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});
