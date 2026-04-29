import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { detectQueryIntent, buildKnowledgeContext } from '@/lib/utils/knowledge';
import { fetchFromDatabase } from '@/lib/utils/database';
import { 
  searchEmployeesWithData, 
  searchProjectsWithData, 
  searchTasksWithData 
} from '@/lib/utils/embeddings';
import type { KnowledgeQuery, KnowledgeResponse, ApiResponse } from '@/types';

// Zod schema for request body validation
const KnowledgeQuerySchema: z.ZodType<KnowledgeQuery> = z.object({
  query: z.string().min(1, 'Query is required'),
  context: z.object({
    employee_id: z.string().optional(),
    project_id: z.string().optional(),
    task_id: z.string().optional(),
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
  if (context?.project_id) {
    const projects = await fetchFromDatabase('projects', { id: context.project_id });
    if (projects.length > 0) {
      const project = projects[0] as any;
      contextParts.push(
        `Project: ${project.name || 'Unknown'} (ID: ${project.id || 'N/A'})`,
        `  Description: ${project.description || 'No description'}`,
        `  Status: ${project.status || 'Unknown'}`,
        `  Dates: ${project.startdate || 'N/A'} to ${project.enddate || 'N/A'}`
      );
    }
  }

  if (context?.employee_id) {
    const employees = await fetchFromDatabase('employees', { id: context.employee_id });
    if (employees.length > 0) {
      const employee = employees[0] as any;
      const skills = Array.isArray(employee.skills) ? employee.skills.join(', ') : 'None';
      contextParts.push(
        `Employee: ${employee.name || 'Unknown'} (ID: ${employee.id || 'N/A'})`,
        `  Email: ${employee.email || 'No email'}`,
        `  Role: ${employee.role || 'Unknown'}`,
        `  Department: ${employee.department || 'Unknown'}`,
        `  Skills: ${skills}`,
        `  Assigned Projects: ${employee.projects?.join(', ') || 'None'}`
      );
    }
  }

  if (context?.task_id) {
    const tasks = await fetchFromDatabase('tasks', { id: context.task_id });
    if (tasks.length > 0) {
      const task = tasks[0] as any;
      contextParts.push(
        `Task: ${task.title || 'Unknown'} (ID: ${task.id || 'N/A'})`,
        `  Description: ${task.description || 'No description'}`,
        `  Status: ${task.status || 'Unknown'}`,
        `  Project ID: ${task.projectid || 'N/A'}`,
        `  Assigned To: ${task.assignedto || 'Unassigned'}`,
        `  Due Date: ${task.duedate || 'No due date'}`
      );
    }
  }

  // Use shared detectQueryIntent to fetch additional data based on query
  if (query) {
    const intent = detectQueryIntent(query);
    console.log('DEBUG: Query intent detected:', intent, 'for query:', query);
    
    if (intent === 'employee' && !context?.employee_id) {
      const results = await searchEmployeesWithData(query, 5);
      if (results.length > 0) {
        contextParts.push(`Relevant Employees (${results.length}):`);
        results.forEach((emp) => {
          const skills = Array.isArray(emp.skills) ? emp.skills.join(', ') : 'None';
          contextParts.push(
            `  - ${emp.name || 'Unknown'} (Role: ${emp.role || 'Unknown'}, Department: ${emp.department || 'Unknown'}, Skills: ${skills})`
          );
        });
      }
    }

    if (intent === 'task' && !context?.task_id) {
      const results = await searchTasksWithData(query, 5);
      if (results.length > 0) {
        contextParts.push(`Relevant Tasks (${results.length}):`);
        results.forEach((task) => {
          contextParts.push(
            `  - ${task.title || 'Unknown'} (Status: ${task.status || 'Unknown'}, Assigned To: ${task.assignedto || 'Unassigned'})`
          );
        });
      }
    }

    if (intent === 'project' && !context?.project_id) {
      const results = await searchProjectsWithData(query, 5);
      if (results.length > 0) {
        contextParts.push(`Relevant Projects (${results.length}):`);
        results.forEach((proj) => {
          contextParts.push(
            `  - ${proj.name || 'Unknown'} (Status: ${proj.status || 'Unknown'})`
          );
        });
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
            content: 'You are a helpful assistant for a project management system. When providing information about employees, projects, or tasks, only include names, roles, departments, skills, and other relevant details. Never include database IDs in your responses.' + (contextString ? '\n\n' + contextString : ''),
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
