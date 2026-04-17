import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getProjects, createProject } from '@/lib/services/projectService';
import { handleApiError } from '@/lib/utils/api-handler';
import { PROJECT_STATUS, PROJECT_PRIORITY } from '@/lib/constants';
import type { Project, ApiResponse } from '@/types';

// Zod schema for query parameter validation
const ProjectQuerySchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
});

// Zod schema for project creation
const ProjectCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(PROJECT_STATUS).default('active'),
  priority: z.enum(PROJECT_PRIORITY).default('medium'),
  progress: z.number().int().min(0).max(100).default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedParams = ProjectQuerySchema.parse(queryParams);

    // Fetch projects from database with filters
    const projects = await getProjects(validatedParams);

    return NextResponse.json(projects, {
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
    const validatedData = ProjectCreateSchema.parse(body);
    const project = await createProject(validatedData as z.infer<typeof ProjectCreateSchema>);

    return NextResponse.json(project, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
