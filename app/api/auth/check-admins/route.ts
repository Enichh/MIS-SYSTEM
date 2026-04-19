import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/server';

// ============================================================================
// Check if any admin accounts exist
// Used to determine if initial setup is needed
// ============================================================================

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { count, error } = await supabase
      .from('admins')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error checking admins:', error);
      return NextResponse.json(
        { hasAdmins: true, error: 'Failed to check admin status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasAdmins: count && count > 0,
      count: count || 0,
    });
  } catch (error) {
    console.error('Check admins API error:', error);
    return NextResponse.json(
      { hasAdmins: true, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
