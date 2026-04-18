import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { STREAMING_CONFIG } from '@/lib/utils/ai-config';
import { handleApiError } from '@/lib/utils/api-handler';
import { detectQueryIntent, buildKnowledgeContext } from '@/lib/utils/knowledge';
import { fetchFromDatabase } from '@/lib/utils/database';
import { parseQuickActionIntent } from '@/lib/utils/quick-actions';
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

// Internal helper: Extract entity data from user message and execute quick action
async function handleQuickAction(intent: string, userMessage: string): Promise<string | null> {
  try {
    let payload: Record<string, unknown> = {};
    let endpoint = '/api/quick-action';
    const missingFields: string[] = [];

    // Simple extraction patterns - in production, use NLP for better parsing
    if (intent === 'create_employee') {
      // Schema requirements: name (NOT NULL), email (NOT NULL, UNIQUE, regex), role (NOT NULL), department (NOT NULL), skills (optional)
      const nameMatch = userMessage.match(/(?:named?|called?)\s+["']?([^"'\.]+)["']?/i) ||
                       userMessage.match(/(?:create|add)\s+(?:an\s+)?employee\s+(?:named?|called?)?\s*["']?([^"'\.]+)["']?/i);
      const emailMatch = userMessage.match(/(?:email)\s+["']?([^"'\s]+)["']?/i);
      const roleMatch = userMessage.match(/(?:as|role)\s+(\w+)/i);
      const deptMatch = userMessage.match(/(?:in|department)\s+(\w+)/i);
      const skillsMatch = userMessage.match(/(?:skills?|with)\s+([^.]+)/i);

      if (nameMatch) payload.name = nameMatch[1].trim();
      if (emailMatch) payload.email = emailMatch[1].trim();
      if (roleMatch) payload.role = roleMatch[1].trim();
      if (deptMatch) payload.department = deptMatch[1].trim();
      if (skillsMatch) {
        payload.skills = skillsMatch[1].split(',').map(s => s.trim()).filter(s => s);
      }

      // Validate required fields
      if (!payload.name) missingFields.push('name');
      if (!payload.email) missingFields.push('email');
      if (!payload.role) missingFields.push('role');
      if (!payload.department) missingFields.push('department');

      if (missingFields.length > 0) {
        return `To create an employee, I need the following information: ${missingFields.join(', ')}. Please provide these details.`;
      }
    }

    if (intent === 'create_project') {
      // Schema requirements: name (NOT NULL), description (optional), status (default 'active'), priority (default 'medium')
      const nameMatch = userMessage.match(/(?:called?|named?)\s+["']?([^"'\.]+)["']?/i) ||
                       userMessage.match(/(?:create|add)\s+(?:a\s+)?project\s+(?:called?|named?)?\s*["']?([^"'\.]+)["']?/i);
      const descMatch = userMessage.match(/(?:descri(?:be|ption)|about)\s+([^.]+)/i);

      if (nameMatch) payload.name = nameMatch[1].trim();
      if (descMatch) payload.description = descMatch[1].trim();

      // Validate required fields
      if (!payload.name) missingFields.push('name');

      if (missingFields.length > 0) {
        return `To create a project, I need the following information: ${missingFields.join(', ')}. Please provide these details.`;
      }
    }

    if (intent === 'create_task') {
      // Schema requirements: title (NOT NULL), projectId (NOT NULL, foreign key), description (optional)
      const titleMatch = userMessage.match(/(?:called?|named?)\s+["']?([^"'\.]+)["']?/i) ||
                        userMessage.match(/(?:create|add)\s+(?:a\s+)?task\s+(?:called?|named?)?\s*["']?([^"'\.]+)["']?/i);
      const descMatch = userMessage.match(/(?:descri(?:be|ption)|about)\s+([^.]+)/i);
      const projectMatch = userMessage.match(/(?:for|in|project)\s+["']?([^"'\.]+)["']?/i);

      if (titleMatch) payload.title = titleMatch[1].trim();
      if (descMatch) payload.description = descMatch[1].trim();

      // Try to find project by name
      if (projectMatch) {
        const projects = await fetchFromDatabase('projects', {});
        const project = (projects as any[]).find(p => p.name.toLowerCase().includes(projectMatch[1].toLowerCase()));
        if (project) {
          payload.projectId = project.id;
        }
      }

      // Validate required fields
      if (!payload.title) missingFields.push('title');
      if (!payload.projectId) missingFields.push('project (specify which project this task belongs to)');

      if (missingFields.length > 0) {
        return `To create a task, I need the following information: ${missingFields.join(', ')}. Please provide these details.`;
      }
    }

    if (intent === 'assign_employee') {
      // This requires existing IDs, so we need to fetch and match by name
      const empNameMatch = userMessage.match(/(?:employee|person)\s+(\w+)/i);
      const taskTitleMatch = userMessage.match(/(?:task)\s+(?:called?|named?)?\s*["']?([^"'\.]+)["']?/i);

      if (empNameMatch && taskTitleMatch) {
        const employees = await fetchFromDatabase('employees', {});
        const matchingEmployees = (employees as any[]).filter(e => e.name.toLowerCase().includes(empNameMatch[1].toLowerCase()));

        if (matchingEmployees.length === 0) {
          return `Could not find any employee matching "${empNameMatch[1]}". Please check the name and try again.`;
        }

        if (matchingEmployees.length > 1) {
          const employeeList = matchingEmployees
            .map(e => `- ${e.name} (Role: ${e.role}, Department: ${e.department}, Email: ${e.email})`)
            .join('\n');
          return `Found multiple employees matching "${empNameMatch[1]}". Please specify which one:\n${employeeList}`;
        }

        const tasks = await fetchFromDatabase('tasks', {});
        const matchingTasks = (tasks as any[]).filter(t => t.title.toLowerCase().includes(taskTitleMatch[1].toLowerCase()));

        if (matchingTasks.length === 0) {
          return `Could not find any task matching "${taskTitleMatch[1]}". Please check the task title and try again.`;
        }

        if (matchingTasks.length > 1) {
          const taskList = matchingTasks
            .map(t => `- ${t.title} (Status: ${t.status}, Priority: ${t.priority})`)
            .join('\n');
          return `Found multiple tasks matching "${taskTitleMatch[1]}". Please specify which one:\n${taskList}`;
        }

        payload.employeeId = matchingEmployees[0].id;
        payload.taskId = matchingTasks[0].id;
      } else {
        return 'To assign an employee to a task, please specify both the employee name and task title.';
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: intent, payload }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      return `Successfully executed ${intent}.`;
    }
    return `Failed to execute ${intent}: ${data.message || 'Unknown error'}`;
  } catch (error) {
    console.error('Quick action error:', error);
    return `Error executing quick action: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
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

    // Check for quick action intent
    const quickActionIntent = parseQuickActionIntent(userQuery || '');
    if (quickActionIntent) {
      const actionResult = await handleQuickAction(quickActionIntent, userQuery || '');
      if (actionResult) {
        // Return the action result as a streaming response
        const result = await streamText({
          model: longcat('LongCat-Flash-Chat'),
          messages: [
            { role: 'system', content: 'You are a helpful assistant for a project management system.' },
            { role: 'user', content: userQuery || '' },
            { role: 'assistant', content: actionResult },
          ],
          temperature: STREAMING_CONFIG.temperature,
          maxTokens: STREAMING_CONFIG.maxTokens,
          topP: STREAMING_CONFIG.topP,
        });
        return result.toDataStreamResponse();
      }
    }

    // Build enhanced context from database
    const contextString = await buildEnhancedContext(userQuery);

    // Inject context into system message
    const messagesWithContext = [
      {
        role: 'system',
        content: 'You are a helpful assistant for a project management system. When providing information about employees, projects, or tasks, only include names, roles, departments, skills, and other relevant details. Never include database IDs in your responses.' + (contextString ? '\n\n' + contextString : ''),
      },
      ...body.messages,
    ];

    const result = await streamText({
      model: longcat('LongCat-Flash-Chat'),
      messages: messagesWithContext,
      temperature: STREAMING_CONFIG.temperature,
      maxTokens: STREAMING_CONFIG.maxTokens,
      topP: STREAMING_CONFIG.topP,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
