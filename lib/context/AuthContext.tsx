'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { createBrowserSupabaseClient } from '@/lib/auth/client';
import type { Admin, AuthSession } from '@/types/auth';

// ============================================================================
// Authentication Context
// ============================================================================
// Provides auth state and session management across the app
// ============================================================================

interface AuthContextValue extends AuthSession {
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialSession?: AuthSession;
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession>({
    user: initialSession?.user || null,
    admin: initialSession?.admin || null,
    isAuthenticated: initialSession?.isAuthenticated || false,
  });
  const [isLoading, setIsLoading] = useState(!initialSession);

  // Listen for auth state changes
  useEffect(() => {
    if (initialSession) {
      return;
    }

    const supabase = createBrowserSupabaseClient();

    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', user.id)
            .eq('is_active', true)
            .single();

          setSession({
            user: { id: user.id, email: user.email! },
            admin: admin as Admin | null,
            isAuthenticated: !!admin,
          });
        } else {
          setSession({ user: null, admin: null, isAuthenticated: false });
        }
      } catch (error) {
        console.error('Session check error:', error);
        setSession({ user: null, admin: null, isAuthenticated: false });
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setSession({ user: null, admin: null, isAuthenticated: false });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const { data: admin } = await supabase
              .from('admins')
              .select('*')
              .eq('id', session.user.id)
              .eq('is_active', true)
              .single();

            setSession({
              user: { id: session.user.id, email: session.user.email! },
              admin: admin as Admin | null,
              isAuthenticated: !!admin,
            });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialSession]);

  const logout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setSession({ user: null, admin: null, isAuthenticated: false });
  };

  const refreshSession = async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: admin } = await supabase
          .from('admins')
          .select('*')
          .eq('id', user.id)
          .eq('is_active', true)
          .single();

        setSession({
          user: { id: user.id, email: user.email! },
          admin: admin as Admin | null,
          isAuthenticated: !!admin,
        });
      } else {
        setSession({ user: null, admin: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...session,
        isLoading,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
