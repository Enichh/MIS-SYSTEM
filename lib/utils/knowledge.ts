import type { KnowledgeQuery, KnowledgeResponse } from '@/types';

function sanitizeQuery(query: string): string {
  return query.trim().replace(/[<>]/g, '');
}

function detectQueryIntent(query: string): 'employee' | 'project' | 'task' | 'report' | 'general' {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('report') || lowerQuery.includes('summary') || lowerQuery.includes('export')) {
    return 'report';
  }
  if (lowerQuery.includes('employee') || lowerQuery.includes('staff') || lowerQuery.includes('worker')) {
    return 'employee';
  }
  if (lowerQuery.includes('project') || lowerQuery.includes('initiative')) {
    return 'project';
  }
  if (lowerQuery.includes('task') || lowerQuery.includes('assignment') || lowerQuery.includes('todo')) {
    return 'task';
  }
  return 'general';
}

function buildKnowledgeContext(context?: KnowledgeQuery['context']): string {
  if (!context) return '';
  
  const parts: string[] = [];
  if (context.employee_id) parts.push(`employee: ${context.employee_id}`);
  if (context.project_id) parts.push(`project: ${context.project_id}`);
  if (context.task_id) parts.push(`task: ${context.task_id}`);
  
  return parts.length > 0 ? parts.join(', ') : '';
}

function formatKnowledgeResponse(answer: string, sources: string[] = [], confidence: number = 0.5): KnowledgeResponse {
  return {
    answer,
    sources,
    confidence,
    relatedEntities: {},
  };
}

export { detectQueryIntent, buildKnowledgeContext };
