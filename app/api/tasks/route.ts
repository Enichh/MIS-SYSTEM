import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTasks, createTask } from '@/lib/services/taskService';
import { handleApiError } from '@/lib/utils/api-handler';
import { TASK_STATUS, TASK_PRIORITY } from '@/lib/constants';
import type { Task, ApiResponse } from '@/types';

// Zod schema for query parameter validation
const TaskQuerySchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
  projectId: z.string().optional(),
  assignedTo: z.string().optional(),
  name: z.string().max(100).optional(), // Optional name/title filter for case-insensitive partial matching
});

// Zod schema for task creation
const TaskCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(TASK_STATUS).default('pending'),
  priority: z.enum(TASK_PRIORITY).default('medium'),
  dependencies: z.array(z.string()).default([]),
  projectId: z.string().min(1, 'Project ID is required'),
  assignedTo: z.string().nullable().default(null),
  dueDate: z.string().optional(),
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
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = TaskCreateSchema.parse(body);
    const task = await createTask(validatedData as z.infer<typeof TaskCreateSchema>);

    return NextResponse.json(task, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
