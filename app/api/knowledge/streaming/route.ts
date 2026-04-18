import { NextRequest, NextResponse } from 'next/server';
import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { STREAMING_CONFIG } from '@/lib/utils/ai-config';
import { handleApiError } from '@/lib/utils/api-handler';
import { detectQueryIntent, buildKnowledgeContext } from '@/lib/utils/knowledge';
import { fetchFromDatabase, updateToDatabase } from '@/lib/utils/database';
import { createEmployee } from '@/lib/services/employeeService';
import { createProject } from '@/lib/services/projectService';
import { createTask } from '@/lib/services/taskService';
import type { ApiResponse, KnowledgeQuery } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Internal helper: Build enhanced context with database fetching
async function buildEnhancedContext(query?: string): Promise<string> {
  const contextParts: string[] = [];

  if (query) {
    const intent = detectQueryIntent(query);

    if (intent === 'employee') {
      const employees = await fetchFromDatabase('employees', {});
      if (employees.length > 0) {
        contextParts.push(`All Employees (${employees.length}):`);
        (employees as any[]).forEach((emp) => {
          const skills = Array.isArray(emp.skills) ? emp.skills.join(', ') : 'None';
          contextParts.push(
            `  - ${emp.name || 'Unknown'} (ID: ${emp.id || 'N/A'}, Role: ${emp.role || 'Unknown'}, Department: ${emp.department || 'Unknown'}, Skills: ${skills})`
          );
        });
      }
    }

    if (intent === 'task') {
      const tasks = await fetchFromDatabase('tasks', {});
      if (tasks.length > 0) {
        contextParts.push(`All Tasks (${tasks.length}):`);
        (tasks as any[]).forEach((task) => {
          contextParts.push(
            `  - ${task.title || 'Unknown'} (ID: ${task.id || 'N/A'}, Status: ${task.status || 'Unknown'}, Assigned To: ${task.assignedTo || 'Unassigned'})`
          );
        });
      }
    }

    if (intent === 'project') {
      const projects = await fetchFromDatabase('projects', {});
      if (projects.length > 0) {
        contextParts.push(`All Projects (${projects.length}):`);
        (projects as any[]).forEach((proj) => {
          contextParts.push(
            `  - ${proj.name || 'Unknown'} (ID: ${proj.id || 'N/A'}, Status: ${proj.status || 'Unknown'})`
          );
        });
      }
    }
  }

  return contextParts.join('\n');
}

// TODO: Add authentication check before production deployment

// Define tools for entity creation and assignment
const tools = {
  createEmployee: tool({
    description: 'Create a new employee in the system',
    parameters: z.object({
      name: z.string().describe('Employee name (required)'),
      email: z.string().email().describe('Employee email (required)'),
      role: z.string().describe('Employee role (required)'),
      department: z.string().describe('Employee department (required)'),
      skills: z.array(z.string()).optional().describe('Employee skills (optional)'),
    }),
    execute: async ({ name, email, role, department, skills }) => {
      try {
        await createEmployee({ name, email, role, department, skills: skills || [] });
        return `Employee "${name}" created successfully.`;
      } catch (error) {
        return `Failed to create employee: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  }),

  createProject: tool({
    description: 'Create a new project in the system',
    parameters: z.object({
      name: z.string().describe('Project name (required)'),
      description: z.string().optional().describe('Project description (optional)'),
    }),
    execute: async ({ name, description }) => {
      try {
        await createProject({ 
          name, 
          description: description || '',
          status: 'active',
          priority: 'medium',
          progress: 0,
        });
        return `Project "${name}" created successfully.`;
      } catch (error) {
        return `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  }),

  createTask: tool({
    description: 'Create a new task in the system',
    parameters: z.object({
      title: z.string().describe('Task title (required)'),
      description: z.string().optional().describe('Task description (optional)'),
      projectId: z.string().describe('Project ID (required - use getProjectId tool to find it)'),
    }),
    execute: async ({ title, description, projectId }) => {
      try {
        await createTask({ 
          title, 
          description: description || '',
          projectId,
          status: 'pending',
          priority: 'medium',
          dependencies: [],
          assignedTo: null,
        });
        return `Task "${title}" created successfully.`;
      } catch (error) {
        return `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  }),

  assignEmployee: tool({
    description: 'Assign an employee to a task',
    parameters: z.object({
      employeeId: z.string().describe('Employee ID (required - use getEmployeeId tool to find it)'),
      taskId: z.string().describe('Task ID (required - use getTaskId tool to find it)'),
    }),
    execute: async ({ employeeId, taskId }) => {
      try {
        // Verify employee exists
        const employees = await fetchFromDatabase('employees', { id: employeeId });
        if (!employees || employees.length === 0) {
          return 'Employee not found. Please use getEmployeeId tool to find the correct ID.';
        }

        // Verify task exists
        const tasks = await fetchFromDatabase('tasks', { id: taskId });
        if (!tasks || tasks.length === 0) {
          return 'Task not found. Please use getTaskId tool to find the correct ID.';
        }

        await updateToDatabase('tasks', taskId, { assignedTo: employeeId });
        return 'Employee assigned to task successfully.';
      } catch (error) {
        return `Failed to assign employee: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  }),

  getEmployeeId: tool({
    description: 'Find an employee ID by name',
    parameters: z.object({
      name: z.string().describe('Employee name to search for'),
    }),
    execute: async ({ name }) => {
      const employees = await fetchFromDatabase('employees', {});
      const matches = (employees as any[]).filter((e) =>
        e.name.toLowerCase().includes(name.toLowerCase())
      );
      if (matches.length === 0) {
        return `No employee found matching "${name}".`;
      }
      if (matches.length > 1) {
        const list = matches.map((e) => `${e.name} (ID: ${e.id}, Role: ${e.role})`).join(', ');
        return `Multiple employees found: ${list}. Please be more specific.`;
      }
      return matches[0].id;
    },
  }),

  getProjectId: tool({
    description: 'Find a project ID by name',
    parameters: z.object({
      name: z.string().describe('Project name to search for'),
    }),
    execute: async ({ name }) => {
      const projects = await fetchFromDatabase('projects', {});
      const matches = (projects as any[]).filter((p) =>
        p.name.toLowerCase().includes(name.toLowerCase())
      );
      if (matches.length === 0) {
        return `No project found matching "${name}".`;
      }
      if (matches.length > 1) {
        const list = matches.map((p) => `${p.name} (ID: ${p.id})`).join(', ');
        return `Multiple projects found: ${list}. Please be more specific.`;
      }
      return matches[0].id;
    },
  }),

  getTaskId: tool({
    description: 'Find a task ID by title',
    parameters: z.object({
      title: z.string().describe('Task title to search for'),
    }),
    execute: async ({ title }) => {
      const tasks = await fetchFromDatabase('tasks', {});
      const matches = (tasks as any[]).filter((t) =>
        t.title.toLowerCase().includes(title.toLowerCase())
      );
      if (matches.length === 0) {
        return `No task found matching "${title}".`;
      }
      if (matches.length > 1) {
        const list = matches.map((t) => `${t.title} (ID: ${t.id})`).join(', ');
        return `Multiple tasks found: ${list}. Please be more specific.`;
      }
      return matches[0].id;
    },
  }),
};

export async function POST(request: NextRequest) {
  const LONGCAT_API_KEY = process.env.LONGCAT_API_KEY;

  if (!LONGCAT_API_KEY) {
    const errorResponse: ApiResponse = {
      code: 'MISSING_API_KEY',
      message: 'LONGCAT_API_KEY environment variable is not configured',
    };
    return NextResponse.json(errorResponse, {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const longcat = createOpenAI({
    name: 'longcat',
    apiKey: LONGCAT_API_KEY,
    baseURL: 'https://api.longcat.chat/openai/v1',
  });

  try {
    const body = await request.json();

    if (!Array.isArray(body.messages)) {
      const errorResponse: ApiResponse = {
        code: 'VALIDATION_ERROR',
        message: 'messages must be an array',
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract the last user message to build context
    const lastUserMessage = body.messages
      .filter((msg: any) => msg.role === 'user')
      .slice(-1)[0];
    const userQuery = lastUserMessage?.content;

    // Build enhanced context from database
    const contextString = await buildEnhancedContext(userQuery);

    // Inject context into system message with tool descriptions
    const systemPrompt = `You are a helpful assistant for a project management system. When providing information about employees, projects, or tasks, only include names, roles, departments, skills, and other relevant details. Never include database IDs in your responses.

You have access to tools to create employees, projects, tasks, and assign employees to tasks. When the user asks to perform these actions, use the appropriate tools. For tasks, you need to use the getProjectId tool first to find the project ID. For assigning employees, use getEmployeeId and getTaskId tools to find the IDs.` + (contextString ? '\n\n' + contextString : '');

    const messagesWithContext = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...body.messages,
    ];

    const result = await streamText({
      model: longcat('LongCat-Flash-Chat'),
      messages: messagesWithContext,
      temperature: STREAMING_CONFIG.temperature,
      maxTokens: STREAMING_CONFIG.maxTokens,
      topP: STREAMING_CONFIG.topP,
      tools,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
