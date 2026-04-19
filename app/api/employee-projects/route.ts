import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmployeeProjects, assignEmployeeToProject, removeEmployeeFromProject } from '@/lib/services/employeeProjectService';
import { handleApiError } from '@/lib/utils/api-handler';
import type { ApiResponse } from '@/types';

// Zod schema for query parameter validation
const EmployeeProjectQuerySchema = z.object({
  employee_id: z.string().optional(),
  project_id: z.string().optional(),
});

// Zod schema for employee-project assignment
const EmployeeProjectAssignSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  project_id: z.string().min(1, 'Project ID is required'),
});

// Zod schema for employee-project removal
const EmployeeProjectRemoveSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  project_id: z.string().min(1, 'Project ID is required'),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[EMPLOYEE_PROJECT_GET] Fetching employee-project relationships');
    
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = EmployeeProjectQuerySchema.parse(queryParams);
    const employeeProjects = await getEmployeeProjects(validatedParams);

    console.log(`[EMPLOYEE_PROJECT_GET] Retrieved ${employeeProjects.length} employee-project relationships`);
    
    return NextResponse.json(employeeProjects, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.log('[EMPLOYEE_PROJECT_GET] Error:', error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[EMPLOYEE_PROJECT_POST] Creating employee-project assignment');
    
    const body = await request.json();
    const validatedData = EmployeeProjectAssignSchema.parse(body);

    console.log(`[EMPLOYEE_PROJECT_POST] Assigning employee ${validatedData.employee_id} to project ${validatedData.project_id}`);
    
    const result = await assignEmployeeToProject(validatedData.employee_id, validatedData.project_id);

    return NextResponse.json(result, {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.log('[EMPLOYEE_PROJECT_POST] Error:', error);
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('[EMPLOYEE_PROJECT_DELETE] Removing employee-project assignment');
    
    const body = await request.json();
    const validatedData = EmployeeProjectRemoveSchema.parse(body);

    console.log(`[EMPLOYEE_PROJECT_DELETE] Removing employee ${validatedData.employee_id} from project ${validatedData.project_id}`);
    
    const result = await removeEmployeeFromProject(validatedData.employee_id, validatedData.project_id);

    return NextResponse.json(result, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.log('[EMPLOYEE_PROJECT_DELETE] Error:', error);
    return handleApiError(error);
  }
}
