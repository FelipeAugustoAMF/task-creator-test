import "server-only";

import { createClient } from "@supabase/supabase-js";

let cachedAdminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  if (!cachedAdminClient) {
    cachedAdminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return cachedAdminClient;
}

