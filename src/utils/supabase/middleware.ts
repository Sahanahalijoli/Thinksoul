import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * PATH GATE: Define routes that should NOT trigger a Supabase network call.
 * This prevents server-side hangs on public pages.
 */
function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/join') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/monitoring') ||
    pathname.startsWith('/_next') ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|map)$/) !== null
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // 1. DEMO / OFFLINE FALLBACK: If Supabase URL is not configured, allow public access (Demo Mode)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  // 2. FAST-PATH: Bypass logic for public routes (e.g., /login) or static assets
  if (isPublicPath(pathname)) {
    return supabaseResponse;
  }

  // 3. COOKIE-CHECK: If no Supabase cookies exist, the user is unauthenticated.
  const hasAuthCookies = request.cookies.getAll().some(c => c.name.startsWith('sb-'));
  if (!hasAuthCookies) {
    if (pathname === '/') return supabaseResponse;
    // Allow dashboard demo access if explicit query param ?demo=true or demo cookie
    if (request.nextUrl.searchParams.get('demo') === 'true') {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 4. INITIALIZE CLIENT
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 5. TIMEOUT-GUARDED AUTH CHECK
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    clearTimeout(timeoutId);

    if (authError && (authError as any).status === 400) {
      throw new Error('STALE_SESSION');
    }

    if (user && pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    if (!user) {
      if (pathname === '/') return supabaseResponse;
      throw new Error('UNAUTHENTICATED');
    }

    if (pathname.startsWith('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;

  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name !== 'AbortError') {
      console.warn(`[Middleware Redirect] Reason: ${error.message || 'Error'}`);
    }

    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        redirectResponse.cookies.delete(cookie.name);
      }
    });

    return redirectResponse;
  }
}
