import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchFromDatabase } from '@/lib/utils/database';
import type { Task, Employee, ApiResponse } from '@/types';

const TaskRecommendationSchema = z.object({
  context: z.string().min(1, 'Context is required'),
  type: z.enum(['employees', 'related_tasks', 'priority']).optional(),
  taskId: z.string().optional(),
});

export const dynamic = 'force-dynamic';

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
    const body = await request.json();
    const validatedData = TaskRecommendationSchema.parse(body);
    const { context, type = 'employees', taskId } = validatedData;

    // Fetch data based on recommendation type
    let systemContext = '';
    let responseKey = '';

    if (type === 'employees') {
      // Fetch employees for task assignment recommendations
      const employees = await fetchFromDatabase<Employee>('employees', {});
      systemContext = `You are a task assignment recommendation assistant. Based on the user's context, recommend the best employees to assign to a task.

Available employees:
${employees.map((emp) => {
  const skills = Array.isArray(emp.skills) ? emp.skills.join(', ') : 'None';
  return `- ID: ${emp.id}, Name: ${emp.name}, Role: ${emp.role}, Department: ${emp.department}, Skills: ${skills}`;
}).join('\n')}

Return your response as a JSON object with a "recommendations" array containing employee IDs and a "reasoning" string explaining the recommendations. Format: {"recommendations": ["id1", "id2", ...], "reasoning": "explanation"}`;
      responseKey = 'employees';
    } else if (type === 'related_tasks') {
      // Fetch tasks for related task recommendations
      const tasks = await fetchFromDatabase<Task>('tasks', {});
      const excludeId = taskId ? `Exclude task ID: ${taskId}` : '';
      systemContext = `You are a task recommendation assistant. Based on the user's context, recommend related or similar tasks.

Available tasks:
${tasks.map((task) => {
  return `- ID: ${task.id}, Title: ${task.title}, Status: ${task.status}, Priority: ${task.priority}, Project ID: ${task.projectid}`;
}).join('\n')}
${excludeId}

Return your response as a JSON object with a "recommendations" array containing task IDs and a "reasoning" string explaining the recommendations. Format: {"recommendations": ["id1", "id2", ...], "reasoning": "explanation"}`;
      responseKey = 'tasks';
    } else if (type === 'priority') {
      // Fetch tasks for priority recommendations
      const tasks = await fetchFromDatabase<Task>('tasks', {});
      systemContext = `You are a task priority recommendation assistant. Based on the user's context, recommend which tasks should be prioritized.

Available tasks:
${tasks.map((task) => {
  return `- ID: ${task.id}, Title: ${task.title}, Status: ${task.status}, Priority: ${task.priority}, Due Date: ${task.duedate || 'None'}`;
}).join('\n')}

Return your response as a JSON object with a "recommendations" array containing task IDs and a "reasoning" string explaining the recommendations. Format: {"recommendations": ["id1", "id2", ...], "reasoning": "explanation"}`;
      responseKey = 'tasks';
    }

    // Call LONGCAT API for AI recommendations
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
            content: systemContext,
          },
          { role: 'user', content: context },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`LONGCAT API error: ${response.status} ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '{}';
    
    // Parse AI response
    let parsedResponse: { recommendations: string[]; reasoning: string };
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      parsedResponse = { recommendations: [], reasoning: 'Failed to generate recommendations' };
    }

    return NextResponse.json(parsedResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
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
