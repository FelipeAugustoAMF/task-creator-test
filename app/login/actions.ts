"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import {
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/session";
import { authenticateAppUser } from "@/lib/auth/users";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

export type LoginActionResult = { ok: true } | { ok: false; message: string };

export async function loginAction(input: {
  username: string;
  password: string;
}): Promise<LoginActionResult> {
  function toSafeLoginErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("APP_SESSION_SECRET")) {
      return "Configuração incompleta do servidor (APP_SESSION_SECRET).";
    }

    if (message.includes("SUPABASE_URL") || message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return "Configuração incompleta do Supabase (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).";
    }

    if (message.includes("schema cache") && message.includes("authenticate_app_user")) {
      return "Supabase ainda não atualizou o schema (RPC). Tente novamente em instantes.";
    }

    if (message.toLowerCase().includes("invalid api key") || message.toLowerCase().includes("jwt")) {
      return "Chave do Supabase inválida. Verifique SUPABASE_SERVICE_ROLE_KEY.";
    }

    return "Não foi possível logar. Tente novamente.";
  }

  try {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Entrada inválida" };
    }

    let userId: string | null = null;
    try {
      userId = await authenticateAppUser(parsed.data);
    } catch (error) {
      console.error("loginAction authenticateAppUser error:", error);
      return { ok: false, message: toSafeLoginErrorMessage(error) };
    }

    if (!userId) {
      return { ok: false, message: "Usuário ou senha inválidos" };
    }

    let sessionCookieValue: string;
    try {
      sessionCookieValue = createSessionCookieValue(userId);
    } catch (error) {
      console.error("loginAction createSessionCookieValue error:", error);
      return { ok: false, message: toSafeLoginErrorMessage(error) };
    }

    try {
      cookies().set(
        SESSION_COOKIE_NAME,
        sessionCookieValue,
        SESSION_COOKIE_OPTIONS,
      );
    } catch (error) {
      console.error("loginAction set cookie error:", error);
      return { ok: false, message: toSafeLoginErrorMessage(error) };
    }

    return { ok: true };
  } catch (error) {
    console.error("loginAction unexpected error:", error);
    return { ok: false, message: toSafeLoginErrorMessage(error) };
  }
}
