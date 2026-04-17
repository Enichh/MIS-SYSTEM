import { EmployeeSchema, ProjectSchema, TaskSchema } from '@/types/schemas';
import type { Employee, Project, Task, FormFieldConfig } from '@/types';

export function validateEmployee(data: unknown): Employee {
  return EmployeeSchema.parse(data);
}

export function validateProject(data: unknown): Project {
  return ProjectSchema.parse(data);
}

export function validateTask(data: unknown): Task {
  return TaskSchema.parse(data);
}

export const MODAL_SIZES = {
  sm: 384,
  md: 448,
  lg: 512,
  xl: 576,
} as const;

export const DEFAULT_ANIMATION_DURATION = 300;

export const MODAL_Z_INDEX = 1000;

// Cache for compiled regex patterns to avoid recompilation
const regexCache = new Map<string, RegExp>();

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateField(value: string, config: FormFieldConfig): ValidationResult {
  const { required, type, minLength, maxLength, pattern, min, max } = config;

  if (required && !value.trim()) {
    return { isValid: false, error: formatValidationMessage('required', config.label) };
  }

  if (!value && !required) {
    return { isValid: true };
  }

  const sanitizedValue = sanitizeInput(value);

  if (type === 'email' && !isValidEmail(sanitizedValue)) {
    return { isValid: false, error: formatValidationMessage('email', config.label) };
  }

  if (type === 'number') {
    const numValue = Number(sanitizedValue);
    if (isNaN(numValue)) {
      return { isValid: false, error: formatValidationMessage('number', config.label) };
    }
    if (min !== undefined && numValue < min) {
      return { isValid: false, error: formatValidationMessage('min', config.label, String(min)) };
    }
    if (max !== undefined && numValue > max) {
      return { isValid: false, error: formatValidationMessage('max', config.label, String(max)) };
    }
  }

  if (minLength !== undefined && sanitizedValue.length < minLength) {
    return { isValid: false, error: formatValidationMessage('minLength', config.label, String(minLength)) };
  }

  if (maxLength !== undefined && sanitizedValue.length > maxLength) {
    return { isValid: false, error: formatValidationMessage('maxLength', config.label, String(maxLength)) };
  }

  if (pattern) {
    try {
      const cachedRegex = regexCache.get(pattern) || regexCache.set(pattern, new RegExp(pattern)).get(pattern);
      if (cachedRegex && !cachedRegex.test(sanitizedValue)) {
        return { isValid: false, error: formatValidationMessage('pattern', config.label) };
      }
    } catch (error) {
      return { isValid: false, error: `${config.label} has invalid pattern format` };
    }
  }

  return { isValid: true };
}

// Reserved for downstream workstreams (forms workstream)
// This helper will be used to generate unique IDs for form fields
function generateFormFieldId(name: string, index?: number): string {
  return index !== undefined ? `field-${name}-${index}` : `field-${name}`;
}

function sanitizeInput(value: string): string {
  const trimmed = value.trim();
  // HTML entity encoding to prevent XSS attacks
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };
  return trimmed.replace(/[&<>"'/]/g, (char) => htmlEntities[char]);
}

function formatValidationMessage(rule: string, label: string, constraint?: string): string {
  const messages: Record<string, string> = {
    required: `${label} is required`,
    email: `${label} must be a valid email address`,
    number: `${label} must be a valid number`,
    minLength: `${label} must be at least ${constraint} characters`,
    maxLength: `${label} must not exceed ${constraint} characters`,
    min: `${label} must be at least ${constraint}`,
    max: `${label} must not exceed ${constraint}`,
    pattern: `${label} format is invalid`,
  };
  return messages[rule] || `${label} is invalid`;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
