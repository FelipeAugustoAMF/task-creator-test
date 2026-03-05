import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { parseSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export function getSessionUserId(): string | null {
  const raw = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionCookieValue(raw);
  return session?.userId ?? null;
}

export function requireSessionUserId(): string {
  const userId = getSessionUserId();
  if (!userId) {
    redirect("/login");
  }
  return userId;
}

