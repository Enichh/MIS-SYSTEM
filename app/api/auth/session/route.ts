import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';

// ============================================================================
// Session API Route
// ============================================================================
// Returns the current authenticated session information
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    return NextResponse.json({
      isAuthenticated: session.isAuthenticated,
      admin: session.admin,
      user: session.user,
    });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { 
        isAuthenticated: false,
        admin: null,
        user: null,
        error: 'Failed to get session'
      },
      { status: 500 }
    );
  }
}
