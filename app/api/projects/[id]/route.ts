import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteProject, updateProject } from '@/lib/services/projectService';
import { handleApiError } from '@/lib/utils/api-handler';
import { PROJECT_STATUS, PROJECT_PRIORITY } from '@/lib/constants';

// Zod schema for project updates - partial and omits immutable fields
const ProjectUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  status: z.enum(PROJECT_STATUS).optional(),
  priority: z.enum(PROJECT_PRIORITY).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = ProjectUpdateSchema.parse(body);
    const updatedProject = await updateProject(id, validatedData);

    return NextResponse.json(updatedProject, {
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
