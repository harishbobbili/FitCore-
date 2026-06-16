import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://invalid.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "invalid-anon-key";

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthPage = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup") || request.nextUrl.pathname.startsWith("/forgot-password");
  const isProtected = request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/calendar") || request.nextUrl.pathname.startsWith("/workout") || request.nextUrl.pathname.startsWith("/diet") || request.nextUrl.pathname.startsWith("/cardio") || request.nextUrl.pathname.startsWith("/abs") || request.nextUrl.pathname.startsWith("/analytics") || request.nextUrl.pathname.startsWith("/profile") || request.nextUrl.pathname.startsWith("/ai-coach") || request.nextUrl.pathname.startsWith("/progress");

  if (isProtected && !session) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        expires: cookie.expires,
        sameSite: cookie.sameSite,
      });
    });
    return redirectResponse;
  }

  if (isAuthPage && session) {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        expires: cookie.expires,
        sameSite: cookie.sameSite,
      });
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/calendar/:path*",
    "/workout/:path*",
    "/diet/:path*",
    "/cardio/:path*",
    "/abs/:path*",
    "/analytics/:path*",
    "/profile/:path*",
    "/ai-coach/:path*",
    "/progress/:path*",
    "/login",
    "/signup",
    "/forgot-password",
  ],
};
