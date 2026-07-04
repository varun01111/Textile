import { NextResponse } from "next/server";

import { isLoginEmailAllowed } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectUrl = new URL("/dashboard", requestUrl.origin);

  if (code) {
    const supabase = await createSupabaseServerClient();
    const exchangeResult = supabase
      ? await supabase.auth.exchangeCodeForSession(code)
      : null;
    const user = exchangeResult?.data.user ?? null;

    if (user && !isLoginEmailAllowed(user.email ?? null)) {
      await supabase?.auth.signOut();
      return NextResponse.redirect(
        new URL("/login?error=access_denied", requestUrl.origin),
      );
    }
  }

  return NextResponse.redirect(redirectUrl);
}
