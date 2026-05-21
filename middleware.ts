import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "cookie",
    request.cookies
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; "),
  );
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  const secureCookies = false;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: secureCookies,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        requestHeaders.set(
          "cookie",
          request.cookies
            .getAll()
            .map((cookie) => `${cookie.name}=${cookie.value}`)
            .join("; "),
        );
        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, {
            ...options,
            path: "/",
            sameSite: "lax",
            secure: secureCookies,
          });
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  await supabase.auth.getUser();
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const hostopsSession = getCookieValue(request.headers.get("cookie"), "hostops-session");
    if (hostopsSession) {
      response.cookies.set("hostops-session", hostopsSession, {
        httpOnly: true,
        maxAge: 60 * 60,
        path: "/dashboard",
        sameSite: "lax",
        secure: secureCookies,
      });
    }
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.startsWith(`${name}=`))
    .map((item) => item.slice(name.length + 1))
    .find(Boolean);
}
