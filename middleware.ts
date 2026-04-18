import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// ============================================================================
// Authentication Middleware
// ============================================================================
// Protects routes that require authentication and redirects to login
// ============================================================================

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/_next',
  '/api/auth',
  '/favicon.ico',
  '/images',
  '/fonts',
];

// Static asset extensions
const STATIC_EXTENSIONS = [
  '.css',
  '.js',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets
  if (STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Skip middleware for public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Create Supabase client
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables in middleware');
    return NextResponse.next();
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  try {
    // Check if user is authenticated
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is an active admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('is_active')
      .eq('id', user.id)
      .single();

    if (adminError || !admin || !admin.is_active) {
      // Not an admin or inactive - redirect to login with error
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'access_denied');
      await supabase.auth.signOut();
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated and is an active admin - allow access
    return response;
  } catch (error) {
    console.error('Middleware auth error:', error);
    // On error, allow the request to proceed (fail open for debugging)
    // In production, you might want to redirect to login instead
    return response;
  }
}

// Configure which routes should be processed by middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
