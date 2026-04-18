import { z } from 'zod';

// ============================================================================
// Authentication Schemas
// ============================================================================

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional().default(false),
});

export const AdminSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(1),
  role: z.enum(['admin', 'super_admin']),
  is_active: z.boolean(),
  last_login_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// ============================================================================
// Authentication Types
// ============================================================================

export interface Admin {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  admin?: Admin;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
  } | null;
  admin: Admin | null;
  isAuthenticated: boolean;
}

export interface AuthError {
  code: string;
  message: string;
}

// ============================================================================
// Auth Error Codes
// ============================================================================

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  USER_NOT_FOUND: 'user_not_found',
  USER_INACTIVE: 'user_inactive',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  RATE_LIMITED: 'rate_limited',
  NETWORK_ERROR: 'network_error',
  SERVER_ERROR: 'server_error',
  UNKNOWN_ERROR: 'unknown_error',
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];
