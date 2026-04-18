'use client';

import { useState, useCallback, useEffect } from 'react';
import { createBrowserSupabaseClient, isRateLimited, recordFailedLogin, recordSuccessfulLogin } from '@/lib/auth/client';
import type { LoginCredentials, LoginResult, Admin, AuthSession } from '@/types/auth';
import { AUTH_ERROR_CODES } from '@/types/auth';

// ============================================================================
// Client-side Authentication Hook
// ============================================================================

interface UseAuthReturn {
  // State
  admin: Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Rate limiting
  isRateLimited: boolean;
  rateLimitRemainingSeconds: number;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRateLimitedState, setIsRateLimitedState] = useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(0);

  // Check rate limit status periodically
  useEffect(() => {
    const checkRateLimit = () => {
      const { limited, remainingSeconds } = isRateLimited();
      setIsRateLimitedState(limited);
      setRateLimitRemaining(remainingSeconds);
    };

    checkRateLimit();
    const interval = setInterval(checkRateLimit, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check initial session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Fetch admin details
          const { data: adminData } = await supabase
            .from('admins')
            .select('*')
            .eq('id', user.id)
            .eq('is_active', true)
            .single();
          
          if (adminData) {
            setAdmin(adminData as Admin);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  /**
   * Login function with rate limiting
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    // Check rate limiting
    const { limited, remainingSeconds } = isRateLimited();
    if (limited) {
      return {
        success: false,
        error: `Too many failed attempts. Please try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
      };
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        recordFailedLogin();
        
        // Map error codes
        let errorMessage = 'Invalid email or password';
        if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email address before logging in';
        } else if (error.message.includes('Invalid login')) {
          errorMessage = 'Invalid email or password';
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      if (!data.user) {
        recordFailedLogin();
        return {
          success: false,
          error: 'Authentication failed',
        };
      }

      // Fetch admin details
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', data.user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        // Sign out if not an admin
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Access denied. Admin privileges required.',
        };
      }

      // Record successful login (clears rate limit)
      recordSuccessfulLogin();
      setAdmin(adminData as Admin);

      return {
        success: true,
        admin: adminData as Admin,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      setAdmin(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Failed to sign out' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh the current session
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('id', user.id)
          .eq('is_active', true)
          .single();
        
        setAdmin(adminData as Admin | null);
      } else {
        setAdmin(null);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      setAdmin(null);
    }
  }, []);

  return {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    isRateLimited: isRateLimitedState,
    rateLimitRemainingSeconds: rateLimitRemaining,
    login,
    logout,
    refreshSession,
  };
}
