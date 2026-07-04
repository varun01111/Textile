import { getFeatureReadiness } from "@/lib/env";

function cardTone(ready: boolean, emphasized = false) {
  if (ready && emphasized) {
    return "border-emerald-200 bg-emerald-50/80";
  }

  if (ready) {
    return "border-stone-200 bg-white/80";
  }

  return "border-amber-200 bg-amber-50/80";
}

function statusLabel(ready: boolean, readyLabel = "Ready", missingLabel = "Setup needed") {
  return ready ? readyLabel : missingLabel;
}

export function IntegrationReadinessPanel() {
  const readiness = getFeatureReadiness();
  const items = [
    {
      title: "Core app access",
      description:
        "Supabase powers owner login, database storage, and secure audio access.",
      ready: readiness.coreAppReady,
      missing: readiness.checklist.publicSupabase,
      readyLabel: "Ready",
    },
    {
      title: "Conversation processing",
      description: readiness.mockProcessing
        ? "Mock mode is enabled, so missing or currently failing processing steps can fall back to safe demo data while you test the workflow."
        : "AssemblyAI and OpenRouter are required for live transcription and structured textile insight generation.",
      ready: readiness.processingReady,
      missing: readiness.mockProcessing
        ? []
        : [...readiness.checklist.transcription, ...readiness.checklist.ai],
      readyLabel: readiness.mockProcessing ? "Mock mode active" : "Ready",
    },
    {
      title: "Google Sheets export",
      description:
        "This is only required when you want approved conversations to append into the master spreadsheet.",
      ready: readiness.exportReady,
      missing: readiness.checklist.sheets,
      readyLabel: "Ready",
    },
  ];

  return (
    <section className="surface-panel rounded-[2rem] p-6">
      <p className="section-kicker">
        API Readiness
      </p>
      <h2 className="mt-2 font-serif text-3xl text-stone-900">
        Service setup at a glance
      </h2>
      <p className="section-subcopy mt-3 max-w-3xl text-sm">
        For the quickest start, connect Supabase first. Then either enable
        <code> MOCK_PROCESSING=true </code>
        for fallback demo mode or add AssemblyAI and OpenRouter for full live processing.
        {" "}
        The service-role key is optional for this single-owner MVP.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className={`rounded-[1.75rem] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ${cardTone(item.ready, item.title === "Conversation processing" && readiness.mockProcessing)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-stone-900">{item.title}</p>
              <span className="signal-chip bg-white/90 px-3 py-1 text-[11px]">
                {statusLabel(item.ready, item.readyLabel)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-stone-700">{item.description}</p>
            {item.missing.length > 0 ? (
              <div className="mt-4 rounded-2xl bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Missing
                </p>
                <ul className="mt-2 space-y-2 text-sm text-stone-700">
                  {item.missing.map((value) => (
                    <li key={value}>
                      <code>{value}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
