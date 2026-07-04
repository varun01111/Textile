import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { SetupPanel } from "@/components/setup-panel";
import { getCurrentUser } from "@/lib/auth";
import { hasPublicSupabaseEnv } from "@/lib/env";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage(props: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  const searchParams = await props.searchParams;
  const accessDenied = searchParams.error === "access_denied";

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hero-panel rounded-[2.7rem] p-8 sm:p-10">
        <p className="section-kicker">
          Textile Client Conversation Intelligence
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-6xl leading-[0.95] text-stone-900">
          Turn every client conversation into a polished business signal
        </h1>
        <p className="section-subcopy mt-6 max-w-2xl text-base">
          Capture textile conversations with consent, surface the business-critical
          details, and transform scattered client talk into summaries, trends, and
          next actions that feel investor-ready.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
            {[
              "Visible recording controls only",
              "Structured textile and market insights",
              "One-click review before Sheets export",
            ].map((item) => (
              <div
                key={item}
                className="metric-panel rounded-[1.75rem] p-4 text-sm font-medium text-stone-700"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="accent-panel rounded-[2rem] p-5">
            <p className="section-kicker">What stands out</p>
            <h2 className="mt-3 font-serif text-3xl text-stone-900">
              Designed like a textile strategy desk, not a generic CRM
            </h2>
            <p className="section-subcopy mt-3 text-sm">
              Warm editorial typography, woven textures, and high-contrast action
              panels help the app feel closer to a premium studio tool than a
              spreadsheet wrapper.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="signal-chip">Buyer calls</span>
              <span className="signal-chip">Sample reviews</span>
              <span className="signal-chip">Reorder signals</span>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {accessDenied ? (
          <section className="rounded-[2rem] border border-rose-200 bg-rose-50/90 p-5 text-sm text-rose-900 shadow-sm shadow-rose-950/5">
            This email address is not on the allowed access list for this workspace yet.
          </section>
        ) : null}
        {!hasPublicSupabaseEnv() ? <SetupPanel /> : <LoginForm />}
        <section className="surface-panel rounded-[2rem] p-6">
          <p className="section-kicker">
            Client Demo
          </p>
          <h2 className="mt-2 font-serif text-3xl text-stone-900">
            Need a safe walkthrough right now?
          </h2>
          <p className="section-subcopy mt-3 text-sm">
            Open the public demo workspace to show realistic textile conversations,
            analysis, trends, and follow-up signals without depending on live
            email auth or paid AI quota.
          </p>
          <Link href="/demo/dashboard" className="secondary-btn mt-5">
            Open client demo workspace
          </Link>
        </section>
      </div>
    </div>
  );
}
