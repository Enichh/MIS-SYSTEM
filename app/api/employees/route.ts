import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmployees, createEmployee } from '@/lib/services/employeeService';
import { handleApiError } from '@/lib/utils/api-handler';
import { fetchFromDatabasePaginated } from '@/lib/utils/database';
import type { Employee, ApiResponse } from '@/types';

// Zod schema for query parameter validation
const EmployeeQuerySchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
  name: z.string().max(100).optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
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
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = EmployeeQuerySchema.parse(queryParams);

    const result = await fetchFromDatabasePaginated<Employee>('employees', validatedParams);

    return NextResponse.json(result, {
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
