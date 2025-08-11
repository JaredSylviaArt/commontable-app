import { NextRequest, NextResponse } from 'next/server';
import { authRateLimiter, apiRateLimiter, uploadRateLimiter, messagingRateLimiter } from './lib/rate-limiter';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply different rate limiting based on the route
  if (pathname.startsWith('/api/auth/')) {
    // Strict rate limiting for authentication endpoints
    return authRateLimiter.middleware()(request);
  }
  
  if (pathname.startsWith('/api/upload/')) {
    // Tight rate limiting for file uploads
    return uploadRateLimiter.middleware()(request);
  }
  
  if (pathname.startsWith('/api/messages/')) {
    // Moderate rate limiting for messaging
    return messagingRateLimiter.middleware()(request);
  }
  
  if (pathname.startsWith('/api/')) {
    // General API rate limiting
    return apiRateLimiter.middleware()(request);
  }

  // Security headers for all responses
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://api.stripe.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; " +
    "frame-src 'self' https://js.stripe.com https://accounts.google.com;"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
