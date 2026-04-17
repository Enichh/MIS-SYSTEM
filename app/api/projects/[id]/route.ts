import { NextRequest, NextResponse } from 'next/server';
import { deleteProject } from '@/lib/services/projectService';
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
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const deletedProject = await deleteProject(id);

    return NextResponse.json(deletedProject, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
