import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { hasPublicSupabaseEnv } from "@/lib/env";

export default async function HomePage() {
  if (!hasPublicSupabaseEnv()) {
    redirect("/login");
  }

  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
