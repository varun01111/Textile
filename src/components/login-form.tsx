"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setStatus(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        throw signInError;
      }

      setStatus("Magic link sent. Open the email and come back here to continue.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not start sign-in.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="surface-panel rounded-[1.75rem] p-6 sm:rounded-[2rem] sm:p-8"
    >
      <p className="section-kicker">
        Owner Access
      </p>
      <h2 className="mt-2 font-serif text-2xl text-stone-900 sm:text-3xl">
        Send a secure sign-in link
      </h2>
      <p className="section-subcopy mt-3 text-sm">
        This MVP uses Supabase magic-link authentication for a single owner account.
      </p>
      <p className="quiet-panel mt-3 rounded-2xl px-4 py-3 text-sm text-stone-600 shadow-none">
        If email delivery is slow or rate-limited during a meeting, use the
        client demo workspace below to keep the walkthrough moving.
      </p>
      <label className="mt-6 block text-sm font-medium text-stone-800">
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@brand.com"
          className="field-control mt-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="primary-btn mt-6 w-full"
      >
        {pending ? "Sending..." : "Send magic link"}
      </button>
      {status ? (
        <p className="success-notice mt-4">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="error-notice mt-4">
          {error}
        </p>
      ) : null}
    </form>
  );
}
