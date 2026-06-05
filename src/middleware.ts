import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            // Supabase's default maxAge matches the JWT expiry (3600s), which resets
            // the cookie lifetime on every middleware refresh and logs users out after
            // 1 hour. Extend active-session cookies to 1 year; leave deletion cookies
            // (maxAge: 0) untouched so logout still works.
            const maxAge =
              options?.maxAge && options.maxAge > 0
                ? 60 * 60 * 24 * 365
                : options?.maxAge;
            supabaseResponse.cookies.set(name, value, { ...options, maxAge });
          });
        },
      },
    }
  );

  // Refresh the session so server route handlers always see a valid user
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-out visitors to the root see the marketing landing page instead of the app.
  if (request.nextUrl.pathname === "/" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/landing";
    const redirect = NextResponse.redirect(url);
    // Carry over any refreshed session cookies so the redirect doesn't drop them.
    supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
