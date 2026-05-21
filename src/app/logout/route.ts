import { NextResponse, type NextRequest } from "next/server";
import { HOSTOPS_SESSION_COOKIE } from "@/lib/auth/session-cookie";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const response = NextResponse.redirect(getPublicUrl(request, "/login"));
  response.cookies.set(HOSTOPS_SESSION_COOKIE, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: false,
  });
  response.headers.append(
    "Set-Cookie",
    `${HOSTOPS_SESSION_COOKIE}=; Path=/dashboard; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`,
  );
  response.cookies.set("hostops-access", "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: false,
  });
  response.headers.append(
    "Set-Cookie",
    "hostops-access=; Path=/dashboard; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax",
  );
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
