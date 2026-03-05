import "server-only";

import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "ha_session";

function getSessionSecret() {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) {
    throw new Error("Faltando APP_SESSION_SECRET");
  }
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionCookieValue(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function parseSessionCookieValue(value: string | undefined): { userId: string } | null {
  if (!value) return null;
  const [payload, signature] = value.split(".", 2);
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as any).userId === "string"
    ) {
      return { userId: (parsed as any).userId };
    }
  } catch {
    // ignore
  }

  return null;
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

