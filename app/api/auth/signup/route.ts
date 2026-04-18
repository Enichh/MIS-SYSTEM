import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/server';
import { z } from 'zod';

// ============================================================================
// Signup API Route (Admin Creation)
// ============================================================================
// WARNING: This endpoint is for initial admin setup only.
// In production, consider disabling or adding additional safeguards.
// ============================================================================

const SignupRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'super_admin']).default('admin'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SignupRequestSchema.parse(body);

    const supabase = await createServerSupabaseClient();
    
    // Check if any admins already exist (prevent unauthorized admin creation)
    const { count, error: countError } = await supabase
      .from('admins')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error checking existing admins:', countError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify admin status' },
        { status: 500 }
      );
    }

    // If admins exist, only allow super_admins to create new admins
    // For initial setup, allow creation if no admins exist
    if (count && count > 0) {
      // Check if current user is authenticated and is a super_admin
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required to create admin accounts' },
          { status: 401 }
        );
      }

      const { data: currentAdmin } = await supabase
        .from('admins')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
        return NextResponse.json(
          { success: false, error: 'Only super admins can create new admin accounts' },
          { status: 403 }
        );
      }
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.full_name,
          role: validatedData.role,
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // The trigger should have created the admin record, but let's verify
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (adminError || !admin) {
      // Manually create admin record if trigger didn't work
      const { error: insertError } = await supabase
        .from('admins')
        .insert({
          id: authData.user.id,
          email: validatedData.email,
          full_name: validatedData.full_name,
          role: validatedData.role,
          is_active: true,
        });

      if (insertError) {
        console.error('Failed to create admin record:', insertError);
        // Attempt to clean up auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { success: false, error: 'Failed to create admin profile' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      admin: {
        id: authData.user.id,
        email: validatedData.email,
        full_name: validatedData.full_name,
        role: validatedData.role,
      },
    }, { status: 201 });

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

    console.error('Signup API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
