import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Admin, AuthSession } from '@/types/auth';

// ============================================================================
// Server-side Supabase Client (for use in Server Components/API Routes)
// ============================================================================

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing required Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set.'
    );
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Ignore cookie errors in Server Components
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Ignore cookie errors in Server Components
        }
      },
    },
  });
}

// ============================================================================
// Server-side Auth Helpers
// ============================================================================

/**
 * Get the current authenticated session on the server
 * Use this in Server Components and API routes
 */
export async function getServerSession(): Promise<AuthSession> {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        user: null,
        admin: null,
        isAuthenticated: false,
      };
    }

    // Fetch admin details from public.admins table
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return {
        user: { id: user.id, email: user.email! },
        admin: null,
        isAuthenticated: false,
      };
    }

    return {
      user: { id: user.id, email: user.email! },
      admin: admin as Admin,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Error getting server session:', error);
    return {
      user: null,
      admin: null,
      isAuthenticated: false,
    };
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 * Use this in protected Server Components
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getServerSession();
  
  if (!session.isAuthenticated) {
    throw new Error('UNAUTHORIZED');
  }
  
  return session;
}

/**
 * Check if current user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getServerSession();
  return session.isAuthenticated && session.admin?.role === 'super_admin';
}

/**
 * Get admin by ID (server-side only)
 */
export async function getAdminById(id: string): Promise<Admin | null> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data as Admin;
}

/**
 * Sign out the current user (server-side)
 */
export async function signOutServer(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to sign out' };
  }
}
