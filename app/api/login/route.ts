import { z } from "zod";

import { NextResponse } from "next/server";

import {
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/session";
import { authenticateAppUser } from "@/lib/auth/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

function toSafeLoginErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("APP_SESSION_SECRET")) return "config";
  if (message.includes("SUPABASE_URL") || message.includes("SUPABASE_SERVICE_ROLE_KEY"))
    return "supabase";
  if (message.includes("schema cache") && message.includes("authenticate_app_user")) return "rpc";
  if (message.toLowerCase().includes("invalid api key") || message.toLowerCase().includes("jwt"))
    return "key";
  return "failed";
}

function loginRedirectUrl(request: Request, errorCode: string | null) {
  const url = new URL("/login", request.url);
  if (errorCode) url.searchParams.set("error", errorCode);
  return url;
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.redirect(loginRedirectUrl(request, "input"), { status: 303 });
  }

  const rawUsername = formData.get("username");
  const rawPassword = formData.get("password");
  const input = {
    username: typeof rawUsername === "string" ? rawUsername : "",
    password: typeof rawPassword === "string" ? rawPassword : "",
  };

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.redirect(loginRedirectUrl(request, "input"), { status: 303 });
  }

  let userId: string | null = null;
  try {
    userId = await authenticateAppUser(parsed.data);
  } catch (error) {
    console.error("POST /api/login authenticateAppUser error:", error);
    return NextResponse.redirect(loginRedirectUrl(request, toSafeLoginErrorCode(error)), {
      status: 303,
    });
  }

  if (!userId) {
    return NextResponse.redirect(loginRedirectUrl(request, "invalid"), { status: 303 });
  }

  let sessionCookieValue: string;
  try {
    sessionCookieValue = createSessionCookieValue(userId);
  } catch (error) {
    console.error("POST /api/login createSessionCookieValue error:", error);
    return NextResponse.redirect(loginRedirectUrl(request, toSafeLoginErrorCode(error)), {
      status: 303,
    });
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
  response.cookies.set(SESSION_COOKIE_NAME, sessionCookieValue, SESSION_COOKIE_OPTIONS);
  return response;
}

