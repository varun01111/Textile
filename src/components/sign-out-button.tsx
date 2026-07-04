"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={pending}
      className="rounded-full border border-stone-300 bg-[rgba(255,252,247,0.82)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_10px_28px_-24px_rgba(62,40,25,0.36)] transition hover:border-stone-900 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-52 disabled:shadow-none"
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
