import { NextRequest, NextResponse } from 'next/server';
import { streamText, generateText } from 'ai';
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

// Internal helper: Parse JSON from AI response and execute action
async function handleQuickAction(aiResponse: string): Promise<string | null> {
  try {
    // Try to extract JSON from AI response
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null; // Not an action, return normal AI response
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const actionData = JSON.parse(jsonStr);

    if (!actionData.action || !actionData.data) {
      console.error('Invalid action format:', actionData);
      return null;
    }

    const { action, data } = actionData;
    const endpoint = '/api/quick-action';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: action, payload: data }),
    });

    const result = await response.json();
    if (response.ok && result.success) {
      return `${action.replace('_', ' ')} created successfully.`;
    }
    return `Failed to ${action.replace('_', ' ')}: ${result.message || 'Unknown error'}`;
  } catch (error) {
    console.error('Quick action error:', error);
    return null; // If JSON parsing fails, return normal AI response
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

    // Build enhanced context from database
    const contextString = await buildEnhancedContext(userQuery);

    // Inject context into system message with JSON output instructions for actions
    const systemPrompt = quickActionIntent
      ? `You are a helpful assistant for a project management system.

When the user asks to create an entity (employee, project, task) or assign an employee to a task, output your response as a JSON object in this format:
\`\`\`json
{
  "action": "create_employee" | "create_project" | "create_task" | "assign_employee",
  "data": {
    // Entity fields based on schema
    // For employees: name, email, role, department, skills (optional)
    // For projects: name, description (optional)
    // For tasks: title, description (optional), projectId (required, get from context or ask user)
    // For assign_employee: employeeId, taskId (get from context or ask user)
  }
}
\`\`\`

Schema requirements:
- Employees: name (required), email (required, valid email format), role (required), department (required), skills (optional array)
- Projects: name (required), description (optional)
- Tasks: title (required), projectId (required), description (optional)

If the user doesn't provide all required fields, ask them for the missing information in your response (do not output JSON).` + (contextString ? '\n\n' + contextString : '')
      : `You are a helpful assistant for a project management system. When providing information about employees, projects, or tasks, only include names, roles, departments, skills, and other relevant details. Never include database IDs in your responses.` + (contextString ? '\n\n' + contextString : '');

    const messagesWithContext = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...body.messages,
    ];

    // Use non-streaming for actions, streaming for normal queries
    if (quickActionIntent) {
      const result = await generateText({
        model: longcat('LongCat-Flash-Chat'),
        messages: messagesWithContext,
        temperature: STREAMING_CONFIG.temperature,
        maxTokens: STREAMING_CONFIG.maxTokens,
        topP: STREAMING_CONFIG.topP,
      });

      const actionResult = await handleQuickAction(result.text);

      if (actionResult) {
        return NextResponse.json({ message: actionResult }, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // If no JSON found, return the AI response as-is
      return NextResponse.json({ message: result.text }, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
