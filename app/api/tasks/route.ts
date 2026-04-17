import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTasks } from '@/lib/services/taskService';
import type { Task, ApiResponse } from '@/types';

// Zod schema for query parameter validation
const TaskQuerySchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
  projectId: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedParams = TaskQuerySchema.parse(queryParams);

    // Fetch tasks from database with filters
    const tasks = await getTasks(validatedParams);

    return NextResponse.json(tasks, {
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
