import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { getDemoConversationDetail } from "@/lib/demo-data";
import { formatDate, formatDateTime, summarizeList } from "@/lib/utils";

const sections: Array<{
  key:
    | "importantBusinessPoints"
    | "clientPreferences"
    | "designIdeas"
    | "fabricMentions"
    | "colorMentions"
    | "patternStyleMentions"
    | "marketTrendInsights"
    | "pricingDiscussion"
    | "possibleOrders"
    | "clientConcerns"
    | "newOpportunities"
    | "machineryOpportunities"
    | "sourcingOpportunities"
    | "marketingStrategySuggestions"
    | "salesStrategySuggestions"
    | "ignoredCasualTalk";
  label: string;
}> = [
  { key: "importantBusinessPoints", label: "Important business points" },
  { key: "clientPreferences", label: "Client preferences" },
  { key: "designIdeas", label: "Design ideas" },
  { key: "fabricMentions", label: "Fabric mentions" },
  { key: "colorMentions", label: "Color mentions" },
  { key: "patternStyleMentions", label: "Pattern and style mentions" },
  { key: "marketTrendInsights", label: "Market trend insights" },
  { key: "pricingDiscussion", label: "Pricing discussion" },
  { key: "possibleOrders", label: "Possible orders" },
  { key: "clientConcerns", label: "Client concerns" },
  { key: "newOpportunities", label: "New opportunities" },
  { key: "machineryOpportunities", label: "Machinery opportunities" },
  { key: "sourcingOpportunities", label: "Sourcing opportunities" },
  { key: "marketingStrategySuggestions", label: "Marketing strategy suggestions" },
  { key: "salesStrategySuggestions", label: "Sales strategy suggestions" },
  { key: "ignoredCasualTalk", label: "Ignored casual talk" },
];

export default async function DemoConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = getDemoConversationDetail(id);

  if (!detail || !detail.analysis) {
    notFound();
  }

  const { conversation, transcript, analysis, followUpTasks, exportRecord } = detail;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <section className="hero-panel reveal-rise rounded-[2rem] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker">
                Demo Review
              </p>
              <h2 className="mt-2 font-serif text-4xl text-stone-900">
                {conversation.meetingTitle}
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                {conversation.clientName}
                {" - "}
                {formatDate(conversation.meetingDate)}
              </p>
            </div>
            <StatusBadge status={conversation.processingStatus} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="metric-panel rounded-[1.5rem] p-4 shadow-none">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Opportunity level
              </p>
              <p className="mt-2 text-sm font-semibold text-stone-900">
                {analysis.opportunityLevel}
              </p>
            </div>
            <div className="metric-panel rounded-[1.5rem] p-4 shadow-none md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Next action
              </p>
              <p className="mt-2 text-sm text-stone-800">{analysis.nextAction}</p>
            </div>
          </div>

          <div className="metric-panel mt-6 rounded-[1.5rem] p-4 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Summary
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-800">{analysis.summary}</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {sections.map((section) => {
              const values = analysis.analysis[section.key];

              return (
                <div
                  key={section.key}
                  className="metric-panel rounded-[1.5rem] p-4 shadow-none"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    {section.label}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {values.length > 0 ? (
                      values.map((value) => (
                        <span
                          key={value}
                          className="signal-chip border-stone-200 bg-white/80 px-3 py-2 text-sm normal-case tracking-[0.08em] text-stone-700"
                        >
                          {value}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-stone-600">No signals captured.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-panel reveal-rise reveal-delay-1 rounded-[2rem] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-900">Follow-up tasks</p>
              <p className="mt-1 text-sm text-stone-600">
                In the live app these are editable before approval and export.
              </p>
            </div>
            <Link
              href="/demo/follow-ups"
              className="secondary-btn px-4 py-2"
            >
              Open queue
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {followUpTasks.map((task) => (
              <div
                key={task.id}
                className="metric-panel rounded-[1.5rem] p-4 shadow-none"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{task.taskText}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      Due:
                      {" "}
                      {task.dueDate ?? "No structured due date"}
                    </p>
                  </div>
                  <span className="signal-chip bg-white/82 px-3 py-1 text-[11px] tracking-[0.16em]">
                    {task.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-stone-600">
                  Reminder:
                  {" "}
                  {task.reminderAt ? formatDateTime(task.reminderAt) : "Not scheduled"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="surface-panel reveal-rise reveal-delay-2 rounded-[2rem] p-6">
          <p className="text-sm font-semibold text-stone-900">Transcript</p>
          <p className="mt-1 text-sm text-stone-600">
            Stable app link:
            {" "}
            <code>/conversations/{conversation.id}</code>
          </p>
          <div className="mt-5 space-y-4">
            {transcript?.rawSegments.map((segment, index) => (
              <div
                key={`${segment.startMs ?? index}-${index}`}
                className="metric-panel rounded-[1.5rem] p-4 shadow-none"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  {segment.speaker ?? "Speaker"}
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-700">{segment.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="accent-panel reveal-rise reveal-delay-3 rounded-[2rem] p-6 shadow-none">
          <p className="text-sm font-semibold text-stone-900">Conversation snapshot</p>
          <div className="mt-4 space-y-3 text-sm text-stone-700">
            <p>
              <strong>Client:</strong>
              {" "}
              {conversation.clientName}
            </p>
            <p>
              <strong>Type:</strong>
              {" "}
              {conversation.conversationType.replace(/_/g, " ")}
            </p>
            <p>
              <strong>Audio file:</strong>
              {" "}
              {conversation.audioFileName}
            </p>
            <p>
              <strong>Detected colors:</strong>
              {" "}
              {summarizeList(analysis.analysis.colorMentions)}
            </p>
            <p>
              <strong>Detected fabrics:</strong>
              {" "}
              {summarizeList(analysis.analysis.fabricMentions)}
            </p>
          </div>
        </section>

        {exportRecord ? (
          <section className="accent-panel rounded-[2rem] p-6 shadow-none">
            <p className="text-sm font-semibold text-stone-900">Sheet export</p>
            <p className="mt-2 text-sm text-stone-700">
              Status:
              {" "}
              <strong>{exportRecord.exportStatus}</strong>
            </p>
            <p className="mt-1 text-sm text-stone-700">
              Row number:
              {" "}
              <strong>{exportRecord.rowNumber ?? "-"}</strong>
            </p>
            <p className="mt-1 text-sm text-stone-700">
              Exported at:
              {" "}
              <strong>{formatDateTime(exportRecord.exportedAt)}</strong>
            </p>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
