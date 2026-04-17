import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchFromDatabase } from '@/lib/utils/database';
import type { Employee, ApiResponse } from '@/types';

// Zod schema for query parameter validation
const EmployeeQuerySchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
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
    const employees = await fetchFromDatabase('employees', validatedParams) as Employee[];

    return NextResponse.json(employees, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorResponse: ApiResponse = {
        code: 'VALIDATION_ERROR',
        message: error.errors[0].message,
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Handle other errors
    const errorResponse: ApiResponse = {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    };
    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
