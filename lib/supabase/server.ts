import "server-only";

import { createClient } from "@supabase/supabase-js";

let cachedAdminClient: ReturnType<typeof createClient> | null = null;

const noStoreFetch: typeof fetch = (input, init) => {
  return fetch(input, { ...(init ?? {}), cache: "no-store" });
};

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Faltando SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Faltando SUPABASE_SERVICE_ROLE_KEY");

  if (!cachedAdminClient) {
    cachedAdminClient = createClient(url, serviceRoleKey, {
      global: { fetch: noStoreFetch },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return cachedAdminClient;
}
