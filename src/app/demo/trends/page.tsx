import { getDemoTrendsData } from "@/lib/demo-data";

export default function DemoTrendsPage() {
  const trends = getDemoTrendsData();
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
    <div className="space-y-8">
      <section className="hero-panel reveal-rise rounded-[2.6rem] p-8">
        <p className="section-kicker">
          Demo Trend Memory
        </p>
        <h1 className="mt-3 font-serif text-5xl text-stone-900">
          Repeated signals across approved conversations
        </h1>
        <p className="section-subcopy mt-3 max-w-3xl text-sm">
          This sample trends view shows how approved textile conversations become
          searchable intelligence around colors, fabrics, objections, growth
          opportunities, and commercial strategy shifts.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.title}
            className="surface-panel reveal-rise reveal-delay-1 rounded-[2rem] p-6"
          >
            <h2 className="font-serif text-3xl text-stone-900">{section.title}</h2>
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
