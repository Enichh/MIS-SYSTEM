import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/server';
import { z } from 'zod';

// ============================================================================
// Update Password API Route
// ============================================================================

const UpdatePasswordRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = UpdatePasswordRequestSchema.parse(body);

    const supabase = await createServerSupabaseClient();

    // Check if the user has a recently verified password reset code
    const { data: codeData, error: codeError } = await supabase.rpc(
      'check_password_reset_eligibility',
      {
        p_email: validatedData.email,
      },
    );

    if (codeError) {
      console.error('Password reset eligibility check error:', codeError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify password reset eligibility' },
        { status: 500 },
      );
    }

    const eligibility = codeData as {
      eligible: boolean;
      error?: string;
    };

    if (!eligibility.eligible) {
      return NextResponse.json(
        { success: false, error: eligibility.error || 'Password reset session expired. Please request a new reset code.' },
        { status: 400 },
      );
    }

    // Get the user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('User lookup error:', userError);
      return NextResponse.json(
        { success: false, error: 'Failed to find user' },
        { status: 500 },
      );
    }

    const user = users.find((u) => u.email === validatedData.email);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: validatedData.password,
      },
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 },
      );
    }

    // Mark the password reset code as used
    await supabase.rpc('invalidate_password_reset_code', {
      p_email: validatedData.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error('Update password API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
