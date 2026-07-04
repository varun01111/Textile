import { getFeatureReadiness, getSetupChecklist } from "@/lib/env";

export function SetupPanel() {
  const checklist = getSetupChecklist();
  const readiness = getFeatureReadiness();
  const groups = [
    { title: "Public Supabase", values: checklist.publicSupabase },
    {
      title: "Supabase service role (optional)",
      values: checklist.supabaseAdmin,
    },
    {
      title: readiness.mockProcessing ? "OpenRouter (optional in mock mode)" : "OpenRouter",
      values: readiness.mockProcessing ? [] : checklist.ai,
    },
    {
      title: readiness.mockProcessing
        ? "AssemblyAI (optional in mock mode)"
        : "AssemblyAI",
      values: readiness.mockProcessing ? [] : checklist.transcription,
    },
    { title: "Google Sheets (needed for export only)", values: checklist.sheets },
  ].filter((group) => group.values.length > 0);

  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-amber-200/80 bg-amber-50/85 p-6 shadow-sm shadow-amber-950/5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
        Setup Needed
      </p>
      <h2 className="mt-2 font-serif text-3xl text-stone-900">
        Connect the workspace before the app can run fully
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-700">
        Add the missing environment variables in
        {" "}
        <code>.env.local</code>
        {" "}
        and follow the setup steps in the README for Supabase, AssemblyAI,
        OpenRouter, and Google Sheets.
        {" "}
        The Supabase service-role key is optional for normal owner flows in this MVP.
        {readiness.mockProcessing ? (
          <>
            {" "}
            Mock mode is currently active, so any missing transcription or analysis
            service can temporarily fall back to demo data if the live provider is
            unavailable.
          </>
        ) : null}
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <div
            key={group.title}
            className="rounded-3xl border border-amber-200 bg-white/80 p-4"
          >
            <p className="text-sm font-semibold text-stone-900">{group.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-stone-700">
              {group.values.map((item) => (
                <li key={item}>
                  <code>{item}</code>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
