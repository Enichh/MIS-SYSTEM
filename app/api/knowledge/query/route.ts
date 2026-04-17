import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { detectQueryIntent, buildKnowledgeContext } from '@/lib/utils/knowledge';
import { fetchFromDatabase } from '@/lib/utils/database';
import type { KnowledgeQuery, KnowledgeResponse, ApiResponse } from '@/types';

// Zod schema for request body validation
const KnowledgeQuerySchema: z.ZodType<KnowledgeQuery> = z.object({
  query: z.string().min(1, 'Query is required'),
  context: z.object({
    employeeId: z.string().optional(),
    projectId: z.string().optional(),
    taskId: z.string().optional(),
  }).optional(),
});

export const dynamic = 'force-dynamic';

// Internal helper: Enhanced context builder with database fetching
async function buildEnhancedContext(context?: KnowledgeQuery['context'], query?: string): Promise<string> {
  const contextParts: string[] = [];
  
  // Use shared buildKnowledgeContext for basic context
  const basicContext = buildKnowledgeContext(context);
  if (basicContext) {
    contextParts.push(basicContext);
  }

  // Fetch detailed data based on context
  if (context?.projectId) {
    const projects = await fetchFromDatabase('projects', { id: context.projectId });
    if (projects.length > 0) {
      const project = projects[0] as any;
      contextParts.push(
        `Project: ${project.name || 'Unknown'} (ID: ${project.id || 'N/A'})`,
        `  Description: ${project.description || 'No description'}`,
        `  Status: ${project.status || 'Unknown'}`,
        `  Dates: ${project.startDate || 'N/A'} to ${project.endDate || 'N/A'}`
      );
    }
  }

  if (context?.employeeId) {
    const employees = await fetchFromDatabase('employees', { id: context.employeeId });
    if (employees.length > 0) {
      const employee = employees[0] as any;
      contextParts.push(
        `Employee: ${employee.name || 'Unknown'} (ID: ${employee.id || 'N/A'})`,
        `  Email: ${employee.email || 'No email'}`,
        `  Role: ${employee.role || 'Unknown'}`,
        `  Department: ${employee.department || 'Unknown'}`,
        `  Assigned Projects: ${employee.projects?.join(', ') || 'None'}`
      );
    }
  }

  if (context?.taskId) {
    const tasks = await fetchFromDatabase('tasks', { id: context.taskId });
    if (tasks.length > 0) {
      const task = tasks[0] as any;
      contextParts.push(
        `Task: ${task.title || 'Unknown'} (ID: ${task.id || 'N/A'})`,
        `  Description: ${task.description || 'No description'}`,
        `  Status: ${task.status || 'Unknown'}`,
        `  Project ID: ${task.projectId || 'N/A'}`,
        `  Assigned To: ${task.assignedTo || 'Unassigned'}`,
        `  Due Date: ${task.dueDate || 'No due date'}`
      );
    }
  }

  // Use shared detectQueryIntent to fetch additional data based on query
  if (query) {
    const intent = detectQueryIntent(query);
    console.log('DEBUG: Query intent detected:', intent, 'for query:', query);
    
    if (intent === 'employee' && !context?.employeeId) {
      const employees = await fetchFromDatabase('employees', {});
      if (employees.length > 0) {
        contextParts.push(`All Employees (${employees.length}):`);
        (employees as any[]).forEach((emp) => {
          contextParts.push(
            `  - ${emp.name || 'Unknown'} (ID: ${emp.id || 'N/A'}, Role: ${emp.role || 'Unknown'}, Department: ${emp.department || 'Unknown'})`
          );
        });
      }
    }

    if (intent === 'task' && !context?.taskId) {
      const tasks = await fetchFromDatabase('tasks', {});
      console.log('DEBUG: Fetched tasks:', tasks);
      if (tasks.length > 0) {
        contextParts.push(`All Tasks (${tasks.length}):`);
        (tasks as any[]).forEach((task) => {
          contextParts.push(
            `  - ${task.title || 'Unknown'} (ID: ${task.id || 'N/A'}, Status: ${task.status || 'Unknown'}, Assigned To: ${task.assignedTo || 'Unassigned'})`
          );
        });
      } else {
        console.log('DEBUG: No tasks found in database');
      }
    }

    if (intent === 'project' && !context?.projectId) {
      const projects = await fetchFromDatabase('projects', {});
      console.log('DEBUG: Fetched projects:', projects);
      if (projects.length > 0) {
        contextParts.push(`All Projects (${projects.length}):`);
        (projects as any[]).forEach((proj) => {
          contextParts.push(
            `  - ${proj.name || 'Unknown'} (ID: ${proj.id || 'N/A'}, Status: ${proj.status || 'Unknown'})`
          );
        });
      } else {
        console.log('DEBUG: No projects found in database');
      }
    }
  }

  return contextParts.join('\n');
}

export async function POST(request: NextRequest) {
  const LONGCAT_API_KEY = process.env.LONGCAT_API_KEY;

  if (!LONGCAT_API_KEY) {
    const errorResponse: ApiResponse = {
      code: 'MISSING_API_KEY',
      message: 'LONGCAT_API_KEY environment variable is not configured',
    };
    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const validatedData = KnowledgeQuerySchema.parse(body);

    // Build enhanced context
    const contextString = await buildEnhancedContext(validatedData.context, validatedData.query);

    // Call LONGCAT API
    const response = await fetch('https://api.longcat.chat/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LONGCAT_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'LongCat-Flash-Chat',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for a project management system.' + (contextString ? '\n\n' + contextString : ''),
          },
          { role: 'user', content: validatedData.query },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`LONGCAT API error: ${response.status} ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'No answer available';

    const knowledgeResponse: KnowledgeResponse = {
      answer,
      sources: [],
      confidence: 0.8,
      relatedEntities: validatedData.context || {},
    };

    return NextResponse.json(knowledgeResponse, {
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
