import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/server';
import { z } from 'zod';

// ============================================================================
// Login API Route
// ============================================================================
// Note: This is an alternative to client-side login via useAuth hook.
// The app currently uses client-side auth for better UX (instant feedback).
// This endpoint can be used for server-side auth flows if needed.
// ============================================================================

const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = LoginRequestSchema.parse(body);

    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication failed',
          code: 'AUTH_FAILED'
        },
        { status: 401 }
      );
    }

    // Check if user is an active admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', data.user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      // Sign out the user if not an admin
      await supabase.auth.signOut();
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access denied. Admin privileges required.',
          code: 'ACCESS_DENIED'
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('Login API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}
