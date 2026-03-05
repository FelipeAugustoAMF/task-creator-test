import { redirect } from "next/navigation";
import React from "react";

import { LoginPageClient } from "@/components/LoginPageClient";
import { getSessionUserId } from "@/lib/auth/requireSession";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const userId = getSessionUserId();
  if (userId) {
    redirect("/dashboard");
  }

  return <LoginPageClient />;
}

