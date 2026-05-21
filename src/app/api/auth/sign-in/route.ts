import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  createHostopsSessionCookie,
  HOSTOPS_SESSION_COOKIE,
} from "@/lib/auth/session-cookie";
import { getSupabaseConfig } from "@/lib/env";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { anonKey, url } = getSupabaseConfig();
  const secureCookies = false;
  const response = NextResponse.redirect(getPublicUrl(request, "/dashboard"), 303);

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: secureCookies,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, {
            ...options,
            path: "/",
            sameSite: "lax",
            secure: secureCookies,
          });
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(
      getPublicUrl(request, `/login?error=${encodeURIComponent(error.message)}`),
      303,
    );
  }

  if (data.session?.expires_in && data.user?.id) {
    const hostopsSession = createHostopsSessionCookie({
      email: data.user.email,
      maxAge: data.session.expires_in,
      userId: data.user.id,
    });

    response.cookies.set(
      HOSTOPS_SESSION_COOKIE,
      hostopsSession,
      {
        httpOnly: true,
        maxAge: data.session.expires_in,
        path: "/",
        sameSite: "lax",
        secure: secureCookies,
      },
    );
    response.cookies.set("hostops-access", "", {
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: secureCookies,
    });
    response.headers.append(
      "Set-Cookie",
      "hostops-access=; Path=/dashboard; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax",
    );
  }

  return response;
}

function getPublicUrl(request: NextRequest, path: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) return new URL(path, appUrl);

  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    new URL(request.url).host;
  const protocol = request.headers.get("x-forwarded-proto") ?? "https";

  return new URL(path, `${protocol}://${host}`);
}
