import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmployees, createEmployee } from '@/lib/services/employeeService';
import { handleApiError } from '@/lib/utils/api-handler';
import type { Employee, ApiResponse } from '@/types';

// Zod schema for query parameter validation
const EmployeeQuerySchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
});

// Zod schema for employee creation
const EmployeeCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Department is required'),
  skills: z.array(z.string()).default([]),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedParams = EmployeeQuerySchema.parse(queryParams);

    // Fetch employees from database with filters
    const employees = await getEmployees(validatedParams);

    return NextResponse.json(employees, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = EmployeeCreateSchema.parse(body);
    const employee = await createEmployee(validatedData);

    return NextResponse.json(employee, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
