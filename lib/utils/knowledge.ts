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
  if (context.employeeId) parts.push(`employee: ${context.employeeId}`);
  if (context.projectId) parts.push(`project: ${context.projectId}`);
  if (context.taskId) parts.push(`task: ${context.taskId}`);
  
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
