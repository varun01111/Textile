import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { hasPublicSupabaseEnv, isLoginEmailAllowed } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthenticatedSupabaseClient = SupabaseClient;

export async function ensureProfileForUser(
  user: Pick<User, "id" | "email">,
  client?: AuthenticatedSupabaseClient,
) {
  const supabase = client ?? (await createSupabaseServerClient());

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser(client?: AuthenticatedSupabaseClient) {
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  const supabase = client ?? (await createSupabaseServerClient());

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (!isLoginEmailAllowed(user.email ?? null)) {
      await supabase.auth.signOut();
      return null;
    }

    await ensureProfileForUser(user);
  }

  return user;
}

export async function requireAuthenticatedUser(client?: AuthenticatedSupabaseClient) {
  const user = await getCurrentUser(client);

  if (!user) {
    redirect("/login");
  }

  return user;
}
