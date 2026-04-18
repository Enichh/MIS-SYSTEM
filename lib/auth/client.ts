import { createClient as createBrowserClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Client-side Supabase Client (for use in Client Components)
// ============================================================================

let browserClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing required Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set.'
    );
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return browserClient;
}

// ============================================================================
// Auth Constants
// ============================================================================

export const AUTH_CONFIG = {
  // Session configuration
  SESSION_COOKIE_NAME: 'sb-session',
  REFRESH_COOKIE_NAME: 'sb-refresh',
  
  // Rate limiting (client-side tracking)
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  
  // Session expiry (in seconds)
  SESSION_EXPIRY: 60 * 60, // 1 hour
  REMEMBER_ME_EXPIRY: 30 * 24 * 60 * 60, // 30 days
} as const;

// ============================================================================
// Auth Storage Helpers (localStorage for rate limiting tracking only)
// ============================================================================

const RATE_LIMIT_KEY = 'auth_rate_limit';

interface RateLimitData {
  attempts: number;
  lockedUntil: number | null;
}

export function getRateLimitData(): RateLimitData {
  if (typeof window === 'undefined') {
    return { attempts: 0, lockedUntil: null };
  }
  
  try {
    const data = localStorage.getItem(RATE_LIMIT_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Ignore localStorage errors
  }
  
  return { attempts: 0, lockedUntil: null };
}

export function setRateLimitData(data: RateLimitData): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors
  }
}

export function clearRateLimitData(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(RATE_LIMIT_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

export function isRateLimited(): { limited: boolean; remainingSeconds: number } {
  const data = getRateLimitData();
  
  if (data.lockedUntil && Date.now() < data.lockedUntil) {
    return {
      limited: true,
      remainingSeconds: Math.ceil((data.lockedUntil - Date.now()) / 1000),
    };
  }
  
  // Clear expired lockout
  if (data.lockedUntil && Date.now() >= data.lockedUntil) {
    clearRateLimitData();
  }
  
  return { limited: false, remainingSeconds: 0 };
}

export function recordFailedLogin(): void {
  const data = getRateLimitData();
  data.attempts += 1;
  
  if (data.attempts >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
    data.lockedUntil = Date.now() + AUTH_CONFIG.LOCKOUT_DURATION_MS;
  }
  
  setRateLimitData(data);
}

export function recordSuccessfulLogin(): void {
  clearRateLimitData();
}
