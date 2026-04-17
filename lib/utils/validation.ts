import { EmployeeSchema, ProjectSchema, TaskSchema } from '@/types/schemas';
import type { Employee, Project, Task } from '@/types';

export function validateEmployee(data: unknown): Employee {
  return EmployeeSchema.parse(data);
}

export function validateProject(data: unknown): Project {
  return ProjectSchema.parse(data);
}

export function validateTask(data: unknown): Task {
  return TaskSchema.parse(data);
}
