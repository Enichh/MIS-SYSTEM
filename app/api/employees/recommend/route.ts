import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmployees } from '@/lib/services/employeeService';
import { handleApiError } from '@/lib/utils/api-handler';

const RecommendationRequestSchema = z.object({
  taskTitle: z.string().min(1, 'Task title is required'),
  taskDescription: z.string().optional(),
  projectId: z.string().optional(),
  priority: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskTitle, taskDescription, projectId, priority } = RecommendationRequestSchema.parse(body);

    // Fetch all employees
    const employees = await getEmployees();

    // Simple AI-like recommendation logic based on skills matching
    // In a real implementation, this would use an AI service
    const recommendations = employees
      .map((employee) => {
        let score = 0;
        const keywords = extractKeywords(taskTitle, taskDescription);
        
        // Score based on skill matches
        if (employee.skills && employee.skills.length > 0) {
          keywords.forEach((keyword) => {
            employee.skills.forEach((skill) => {
              if (skill.toLowerCase().includes(keyword.toLowerCase()) || 
                  keyword.toLowerCase().includes(skill.toLowerCase())) {
                score += 10;
              }
            });
          });
        }

        // Score based on role relevance
        const roleKeywords = ['developer', 'designer', 'manager', 'analyst', 'tester', 'engineer'];
        roleKeywords.forEach((roleKeyword) => {
          if (taskTitle.toLowerCase().includes(roleKeyword) && 
              employee.role.toLowerCase().includes(roleKeyword)) {
            score += 15;
          }
        });

        // Add some randomness for variety if scores are tied
        score += Math.random() * 2;

        return { employee, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.employee);

    return NextResponse.json(
      { recommendations },
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

function extractKeywords(title: string, description?: string): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'need', 'create', 'update', 'delete', 'add', 'remove', 'task', 'project'];
  
  const words = text.split(/\s+/).filter((word) => 
    word.length > 2 && !commonWords.includes(word)
  );
  
  return [...new Set(words)];
}
