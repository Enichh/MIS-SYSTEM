import { NextRequest, NextResponse } from 'next/server';
import { deleteTask } from '@/lib/services/taskService';
import { handleApiError } from '@/lib/utils/api-handler';

export const dynamic = 'force-dynamic';

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
