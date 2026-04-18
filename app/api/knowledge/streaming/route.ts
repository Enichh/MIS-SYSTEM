import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { STREAMING_CONFIG } from '@/lib/utils/ai-config';
import { handleApiError } from '@/lib/utils/api-handler';
import { detectQueryIntent, buildKnowledgeContext } from '@/lib/utils/knowledge';
import { fetchFromDatabase } from '@/lib/utils/database';
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
