import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/env";

// We intentionally keep the admin client loose in the MVP so the app can build
// without a generated Supabase schema/types step.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminClient: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseAdminClient(): any {
  if (adminClient) {
    return adminClient;
  }

  const env = getSupabaseAdminEnv();

  adminClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return adminClient;
}
