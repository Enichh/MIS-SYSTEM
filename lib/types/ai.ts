/**
 * AI-related type definitions for streaming responses and quick actions
 */

/**
 * Enum of available quick action types
 */
export type QuickActionType = 'create_employee' | 'create_project' | 'create_task' | 'assign_employee';

/**
 * Configuration for a quick action
 */
export interface QuickActionConfig {
  type: QuickActionType;
  label: string;
  payload: Record<string, unknown>;
}

/**
 * Message structure for streaming chat
 */
export interface StreamingChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}
