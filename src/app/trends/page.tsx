import { SetupPanel } from "@/components/setup-panel";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getTrendsData } from "@/lib/conversations";
import { hasPublicSupabaseEnv } from "@/lib/env";

export default async function TrendsPage() {
  if (!hasPublicSupabaseEnv()) {
    return <SetupPanel />;
  }

  const user = await requireAuthenticatedUser();
  const trends = await getTrendsData(user.id);
  const sections = [
    { title: "Colors clients repeat", values: trends.colors },
    { title: "Fabrics gaining attention", values: trends.fabrics },
    { title: "Design and style directions", values: trends.designs },
    { title: "Common objections", values: trends.concerns },
    { title: "New business opportunities", values: trends.opportunities },
    { title: "Machinery and process signals", values: trends.machinery },
    { title: "Sourcing and supplier signals", values: trends.sourcing },
    { title: "Marketing strategy shifts", values: trends.marketingStrategies },
    { title: "Sales strategy shifts", values: trends.salesStrategies },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="hero-panel rounded-[2rem] p-5 sm:rounded-[2.6rem] sm:p-8">
        <p className="section-kicker">
          Trend Memory
        </p>
        <h1 className="mt-3 font-serif text-4xl text-stone-900 sm:text-5xl">
          Repeated signals across approved conversations
        </h1>
        <p className="section-subcopy mt-3 max-w-3xl text-sm">
          This page is computed from your approved in-app analyses, not from spreadsheet formulas, so it stays close to the source conversations and surfaces color, sourcing, machinery, and strategy signals together.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.title}
            className="surface-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6"
          >
            <h2 className="font-serif text-2xl text-stone-900 sm:text-3xl">{section.title}</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {section.values.length > 0 ? (
                section.values.map((value) => (
                  <div
                    key={`${value.category}-${value.normalizedValue}`}
                    className="signal-chip border-stone-200 bg-white/80 px-4 py-3 text-sm normal-case tracking-[0.08em] text-stone-700"
                  >
                    <strong className="text-stone-900">{value.label}</strong>
                    {" - "}
                    {value.count}
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-600">
                  No approved signals for this section yet.
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
