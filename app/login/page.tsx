import { redirect } from "next/navigation";
import React from "react";

import { LoginPageClient } from "@/components/LoginPageClient";
import { getSessionUserId } from "@/lib/auth/requireSession";

export const dynamic = "force-dynamic";

function toSafeLoginErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) return null;

  switch (errorCode) {
    case "input":
      return "Entrada inválida. Verifique usuário e senha.";
    case "invalid":
      return "Usuário ou senha inválidos.";
    case "config":
      return "Configuração incompleta do servidor (APP_SESSION_SECRET).";
    case "supabase":
      return "Configuração incompleta do Supabase (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).";
    case "rpc":
      return "Supabase ainda não atualizou o schema (RPC). Tente novamente em instantes.";
    case "key":
      return "Chave do Supabase inválida. Verifique SUPABASE_SERVICE_ROLE_KEY.";
    case "failed":
    default:
      return "Não foi possível logar. Tente novamente.";
  }
}

export default function LoginPage(props: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const userId = getSessionUserId();
  if (userId) {
    redirect("/dashboard");
  }

  const errorCode = typeof props.searchParams?.error === "string" ? props.searchParams.error : null;
  const errorMessage = toSafeLoginErrorMessage(errorCode);

  return <LoginPageClient errorMessage={errorMessage} />;
}
