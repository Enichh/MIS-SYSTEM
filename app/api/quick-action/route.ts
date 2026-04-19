import { NextRequest, NextResponse } from 'next/server';
import { validateQuickActionPayload } from '@/lib/utils/quick-actions';
import { QUICK_ACTION_TYPES } from '@/lib/utils/ai-config';
import { createTask } from '@/lib/services/taskService';
import { createEmployee } from '@/lib/services/employeeService';
import { createProject } from '@/lib/services/projectService';
import { updateToDatabase, fetchFromDatabase, insertToDatabase } from '@/lib/utils/database';
import { handleApiError } from '@/lib/utils/api-handler';
import type { ApiResponse } from '@/types';
import type { Task, Employee, Project } from '@/types';

export const dynamic = 'force-dynamic';

// TODO: Add authentication check before production deployment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = validateQuickActionPayload(body);
    if (!validation.success) {
      const errorResponse: ApiResponse = {
        code: 'VALIDATION_ERROR',
        message: validation.error || 'Invalid quick action payload',
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { type, payload } = body;

    if (!QUICK_ACTION_TYPES.includes(type)) {
      const errorResponse: ApiResponse = {
        code: 'INVALID_ACTION_TYPE',
        message: `Invalid action type: ${type}`,
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let result;

    switch (type) {
      case 'create_employee':
        result = await createEmployee(payload as Omit<Employee, 'id' | 'created_at' | 'updated_at'>);
        break;

      case 'create_project':
        result = await createProject(payload as Omit<Project, 'id' | 'created_at' | 'updated_at'>);
        break;

      case 'create_task':
        result = await createTask(payload as Omit<Task, 'id' | 'created_at' | 'updated_at'>);
        break;
      
      case 'assign_employee':
        if (!payload.employee_id || !payload.task_id) {
          const errorResponse: ApiResponse = {
            code: 'MISSING_FIELDS',
            message: 'assign_employee action requires employee_id and task_id',
          };
          return NextResponse.json(errorResponse, {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const employees = await fetchFromDatabase('employees', { id: payload.employee_id });
        if (!employees || employees.length === 0) {
          const errorResponse: ApiResponse = {
            code: 'EMPLOYEE_NOT_FOUND',
            message: 'Employee with specified ID does not exist',
          };
          return NextResponse.json(errorResponse, {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const tasks = await fetchFromDatabase('tasks', { id: payload.task_id });
        if (!tasks || tasks.length === 0) {
          const errorResponse: ApiResponse = {
            code: 'TASK_NOT_FOUND',
            message: 'Task with specified ID does not exist',
          };
          return NextResponse.json(errorResponse, {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        result = await updateToDatabase('tasks', payload.task_id as string, {
          assignedto: payload.employee_id,
        });
        break;
      
      default:
        const errorResponse: ApiResponse = {
          code: 'UNSUPPORTED_ACTION',
          message: `Unsupported action type: ${type}`,
        };
        return NextResponse.json(errorResponse, {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    const successResponse: ApiResponse = {
      code: 'SUCCESS',
      message: 'Quick action executed successfully',
    };
    
    return NextResponse.json(
      { success: true, result, ...successResponse },
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
