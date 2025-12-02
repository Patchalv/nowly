import { PUBLIC_ROUTES, ROUTES } from '@/src/config/constants';
import { env } from '@/src/config/env';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Middleware for Supabase Authentication
 *
 * This middleware runs on every request to:
 * 1. Refresh the user's session if expired
 * 2. Handle authentication cookies properly
 * 3. Ensure auth state is maintained across requests
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({
              name,
              value,
              ...options,
            })
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set({
              name,
              value,
              ...options,
            })
          );
        },
      },
    }
  );

  // Refresh session if expired - this is critical for maintaining auth state
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Helper: check if pathname matches a public route
  const isPublicRoute = (pathname: string): boolean => {
    return PUBLIC_ROUTES.some((route) => {
      // Exact match
      if (pathname === route) return true;

      // For non-root routes, check if pathname starts with route + slash
      // Skip startsWith check for "/" to avoid matching all paths
      if (route !== '/' && pathname.startsWith(`${route}/`)) return true;

      return false;
    });
  };

  // Get current pathname
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets including manifest.json
  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    /\.(svg|png|jpg|jpeg|gif|webp|json)$/.test(pathname)
  ) {
    return response;
  }

  // Handle root path redirect
  if (pathname === ROUTES.HOME) {
    if (user) {
      // Authenticated: redirect to daily view
      return NextResponse.redirect(new URL(ROUTES.DAILY, request.url));
    } else {
      // Unauthenticated: redirect to login
      return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    }
  }

  // Check if route is public
  const isPublic = isPublicRoute(pathname);

  // Protect all non-public routes (secure by default)
  if (!isPublic && !user) {
    // Not authenticated, redirect to login
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  // If already on auth page and authenticated, redirect to daily
  const isAuthPage = pathname === ROUTES.LOGIN || pathname === ROUTES.SIGNUP;
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL(ROUTES.DAILY, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (handled by route handler)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
