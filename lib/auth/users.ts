import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function authenticateAppUser(params: {
  username: string;
  password: string;
}): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc("authenticate_app_user", {
    p_username: params.username,
    p_password: params.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return typeof data === "string" && data ? data : null;
}

