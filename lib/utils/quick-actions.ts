/**
 * Quick action utilities and validation
 */

import { z } from 'zod';
import { QuickActionType, QuickActionConfig } from '../types/ai';

/**
 * Zod schema for quick action payload validation
 */
const QuickActionPayloadSchema = z.object({
  type: z.enum(['create_task', 'assign_employee']),
  label: z.string().min(1),
  payload: z.record(z.unknown()),
});

/**
 * Create a quick action configuration
 */
export function createQuickActionConfig(
  type: QuickActionType,
  label: string,
  payload: Record<string, unknown>
): QuickActionConfig {
  const config = { type, label, payload };
  const result = QuickActionPayloadSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid quick action config: ${result.error.message}`);
  }
  return config;
}

/**
 * Validate quick action payload using Zod
 */
export function validateQuickActionPayload(data: unknown): { success: boolean; error?: string } {
  const result = QuickActionPayloadSchema.safeParse(data);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error.message };
}

/**
 * Regex patterns for intent detection (compiled as constants for performance)
 * Note: Simple pattern matching cannot distinguish between positive and negative intent
 * (e.g., "create a task" vs "don't create a task"). For production use, consider NLP-based intent detection.
 */
const CREATE_TASK_PATTERN = /\bcreate\s+task\b/i;
const ASSIGN_EMPLOYEE_PATTERN = /\bassign\s+employee\b/i;

/**
 * Internal helper: Parse intent from user message
 * Returns the first matching quick action type, or null if no match found.
 */
export function parseQuickActionIntent(message: string): QuickActionType | null {
  if (typeof message !== 'string') {
    return null;
  }
  const lowerMessage = message.toLowerCase();
  if (CREATE_TASK_PATTERN.test(lowerMessage)) {
    return 'create_task';
  }
  if (ASSIGN_EMPLOYEE_PATTERN.test(lowerMessage)) {
    return 'assign_employee';
  }
  return null;
}
