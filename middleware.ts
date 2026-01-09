import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const publicPaths = ['/login', '/register'];

// Paths that require authentication
const protectedPaths = ['/student', '/teacher', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Allow API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/manifest.json')) {
    return NextResponse.next();
  }
  
  // For root path, redirect to login (client-side will handle further routing)
  if (pathname === '/') {
    return NextResponse.next();
  }
  
  // For protected paths, just let Next.js handle it
  // (actual auth check happens in the page components via useEffect)
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|icon-192.png.txt|manifest.json).*)',
  ],
};
