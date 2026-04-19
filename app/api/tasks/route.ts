import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTasks, createTask } from '@/lib/services/taskService';
import { handleApiError } from '@/lib/utils/api-handler';
import { fetchFromDatabasePaginated } from '@/lib/utils/database';
import { TASK_STATUS, TASK_PRIORITY } from '@/lib/constants';
import type { Task, ApiResponse } from '@/types';

// Zod schema for query parameter validation
const TaskQuerySchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  projectid: z.string().optional(),
  assignedto: z.string().optional(),
  name: z.string().max(100).optional(), // Optional name/title filter for case-insensitive partial matching
  dateRangeStart: z.string().optional(), // Calendar date range start filter
  dateRangeEnd: z.string().optional(), // Calendar date range end filter
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Zod schema for task creation
const TaskCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(TASK_STATUS).default('pending'),
  priority: z.enum(TASK_PRIORITY).default('medium'),
  dependencies: z.array(z.string()).default([]),
  projectid: z.string().min(1, 'Project ID is required'),
  assignedto: z.string().nullable().default(null),
  duedate: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = TaskQuerySchema.parse(queryParams);

    const result = await fetchFromDatabasePaginated<Task>('tasks', validatedParams);

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
