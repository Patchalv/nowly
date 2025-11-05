import { env } from '@/src/config/env';
import { PUBLIC_ROUTES } from '@/src/config/constants';
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
      // Exact match or starts with route + slash
      return pathname === route || pathname.startsWith(`${route}/`);
    });
  };

  // Get current pathname
  const { pathname } = request.nextUrl;

  // Handle root path redirect
  if (pathname === '/') {
    if (user) {
      // Authenticated: redirect to daily view
      return NextResponse.redirect(new URL('/daily', request.url));
    } else {
      // Unauthenticated: redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Check if route is public
  const isPublic = isPublicRoute(pathname);

  // Protect all non-public routes (secure by default)
  if (!isPublic && !user) {
    // Not authenticated, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If already on auth page and authenticated, redirect to daily
  const isAuthPage = ['/login', '/signup'].includes(pathname);
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/daily', request.url));
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
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
