import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProjects, createProject } from "@/lib/services/projectService";
import { handleApiError } from "@/lib/utils/api-handler";
import { fetchFromDatabasePaginated } from "@/lib/utils/database";
import { PROJECT_STATUS, PROJECT_PRIORITY } from "@/lib/constants";
import type { Project, ApiResponse } from "@/types";

const ProjectQuerySchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  progressMin: z.coerce.number().min(0).max(100).optional(),
  progressMax: z.coerce.number().min(0).max(100).optional(),
  name: z.string().max(100).optional(),
  dateRangeStart: z.string().optional(),
  dateRangeEnd: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Zod schema for project creation
const ProjectCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(PROJECT_STATUS).default("active"),
  priority: z.enum(PROJECT_PRIORITY).default("medium"),
  progress: z.number().int().min(0).max(100).default(0),
  startdate: z.string().optional(),
  enddate: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = ProjectQuerySchema.parse(queryParams);

    const result = await fetchFromDatabasePaginated<Project>(
      "projects",
      validatedParams,
    );

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
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
    const project = await createProject(
      validatedData as z.infer<typeof ProjectCreateSchema>,
    );

    return NextResponse.json(project, {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
