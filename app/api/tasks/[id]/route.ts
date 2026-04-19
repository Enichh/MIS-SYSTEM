import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteTask, updateTask } from '@/lib/services/taskService';
import { handleApiError } from '@/lib/utils/api-handler';
import { TASK_STATUS, TASK_PRIORITY } from '@/lib/constants';

// Zod schema for task updates - partial and omits immutable fields
const TaskUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.enum(TASK_STATUS).optional(),
  priority: z.enum(TASK_PRIORITY).optional(),
  dependencies: z.array(z.string()).optional(),
  projectid: z.string().uuid('Project ID must be a valid UUID').optional(),
  assignedto: z.string().uuid().nullable().optional(),
  duedate: z.string().optional(),
}).strict();

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = TaskUpdateSchema.parse(body);
    const updatedTask = await updateTask(id, validatedData);

    return NextResponse.json(updatedTask, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const deletedTask = await deleteTask(id);

    return NextResponse.json(deletedTask, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
