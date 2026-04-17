/**
 * AI configuration and streaming utilities
 */

import { QuickActionType } from '../types/ai';

/**
 * Streaming configuration for AI responses
 * maxDuration: Maximum response time in milliseconds (30s)
 * temperature: Controls randomness (0-1, higher = more creative)
 * topP: Nucleus sampling threshold (0-1, limits token choices)
 * maxTokens: Maximum tokens in response (2000)
 */
export const STREAMING_CONFIG = {
  maxDuration: 30000,
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2000,
} as const;

/**
 * Available quick action types
 */
export const QUICK_ACTION_TYPES: readonly QuickActionType[] = ['create_task', 'assign_employee'] as const;

/**
 * Internal helper: Build streaming context from conversation history
 */
export function buildStreamingContext(messages: Array<{ role: string; content: string }>): string {
  if (!Array.isArray(messages)) {
    return '';
  }
  const recentMessages = messages.slice(-5);
  return recentMessages
    .filter((msg) => msg && typeof msg.role === 'string' && typeof msg.content === 'string')
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join('\n');
}
