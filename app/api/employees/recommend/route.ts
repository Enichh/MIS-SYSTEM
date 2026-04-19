import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmployees } from '@/lib/services/employeeService';
import { handleApiError } from '@/lib/utils/api-handler';
import type { ApiResponse } from '@/types';

const RecommendationRequestSchema = z.object({
  taskTitle: z.string().min(1, 'Task title is required'),
  taskDescription: z.string().optional(),
  projectId: z.string().optional(),
  priority: z.string().optional(),
});

const MAX_TOKENS = 1000;

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
    const { taskTitle, taskDescription, projectId, priority } = RecommendationRequestSchema.parse(body);

    // Fetch all employees
    const employees = await getEmployees();

    // Build employee context for AI
    const employeeContext = employees.map((emp) => {
      const skillsStr = emp.skills && emp.skills.length > 0 ? emp.skills.join(', ') : 'None';
      return `ID: ${emp.id}, Name: ${emp.name}, Role: ${emp.role}, Department: ${emp.department}, Email: ${emp.email}, Skills: ${skillsStr}`;
    }).join('\n');

    // Build task context
    const taskContext = `Task Title: ${taskTitle}\nDescription: ${taskDescription || 'None'}\nPriority: ${priority || 'Not specified'}\nProject ID: ${projectId || 'Not specified'}`;

    // Call LONGCAT API to get AI recommendation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
            content: `You are an employee recommendation assistant. Based on the task details, recommend the best employee(s) for the task.

Available employees:
${employeeContext}

Task details:
${taskContext}

Analyze the task requirements and match them with employee skills, roles, and departments. Consider:
- Technical skills match (programming languages, frameworks, tools)
- Role relevance (developer, designer, manager, etc.)
- Department alignment (engineering, marketing, etc.)
- Priority level (high priority tasks may need senior/experienced employees)

Return your response as a JSON array with this exact structure:
[
  {
    "id": "employee_id",
    "reason": "Brief explanation (1 sentence, max 15 words) of why this employee is suitable"
  }
]

Include the top 3 recommendations. If no suitable employees are found, return an empty array [].`,
          },
          { role: 'user', content: `Recommend the best employee for this task: ${taskTitle}` },
        ],
        max_tokens: MAX_TOKENS,
        temperature: 0.3,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`LONGCAT API error: ${response.status} ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '[]';

    // Parse AI response
    let aiRecommendations: Array<{ id: string; reason: string }> = [];
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      aiRecommendations = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      aiRecommendations = [];
    }

    // Map AI recommendations to full employee objects
    const recommendations = aiRecommendations
      .map((rec) => {
        const employee = employees.find((e) => e.id === rec.id);
        if (employee) {
          return {
            ...employee,
            reason: rec.reason || 'Recommended based on task requirements',
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // If AI returned no recommendations, fall back to all employees
    if (recommendations.length === 0) {
      console.warn('AI returned no recommendations, falling back to all employees');
      return NextResponse.json(
        { 
          recommendations: employees.slice(0, 5).map((emp) => ({
            ...emp,
            reason: `${emp.role} from ${emp.department} department with skills: ${emp.skills?.slice(0, 3).join(', ') || 'None specified'}`,
          }))
        },
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return NextResponse.json(
      { recommendations },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    );
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
