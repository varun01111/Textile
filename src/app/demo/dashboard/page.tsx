import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { getDemoDashboardData } from "@/lib/demo-data";
import { compactText, formatDate, formatDateTime, summarizeList } from "@/lib/utils";

export default function DemoDashboardPage() {
  const dashboard = getDemoDashboardData();
  const urgentTasks = [
    ...dashboard.autopilot.overdue,
    ...dashboard.autopilot.dueToday,
    ...dashboard.autopilot.reminderDue,
  ].slice(0, 4);
  const spotlight = dashboard.cards[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="hero-panel reveal-rise rounded-[2rem] p-5 sm:rounded-[2.7rem] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="section-kicker">
              Demo Dashboard
            </p>
            <h1 className="mt-3 font-serif text-4xl text-stone-900 sm:text-5xl">
              Conversation history and opportunity signals
            </h1>
            <p className="section-subcopy mt-3 max-w-3xl text-sm">
              This sample view shows how approved textile conversations turn into
              summaries, follow-ups, and trend intelligence.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/demo/capture" className="primary-btn w-full sm:w-auto">
                Open capture walkthrough
              </Link>
              <Link href="/demo/trends" className="secondary-btn w-full sm:w-auto">
                Open sample trends
              </Link>
            </div>
          </div>
          <div className="accent-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
            <p className="section-kicker">Sample Spotlight</p>
            {spotlight ? (
              <>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl text-stone-900 sm:text-3xl">
                      {spotlight.conversation.meetingTitle}
                    </h2>
                    <p className="mt-2 text-sm text-stone-600">
                      {spotlight.conversation.clientName}
                      {" - "}
                      {formatDate(spotlight.conversation.meetingDate)}
                    </p>
                  </div>
                  <StatusBadge status={spotlight.conversation.processingStatus} />
                </div>
                <p className="section-subcopy mt-4 text-sm">
                  {compactText(
                    spotlight.analysis?.summary ??
                      "The sample spotlight will appear here once data is loaded.",
                    180,
                  )}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {(spotlight.analysis?.analysis.colorMentions ?? []).slice(0, 3).map((item) => (
                    <span key={item} className="signal-chip">
                      {item}
                    </span>
                  ))}
                  {(spotlight.analysis?.analysis.fabricMentions ?? []).slice(0, 2).map((item) => (
                    <span key={item} className="signal-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            ["Total conversations", String(dashboard.metrics.totalConversations)],
            ["High-opportunity leads", String(dashboard.metrics.highOpportunityCount)],
            ["Pending tasks", String(dashboard.metrics.pendingTaskCount)],
            ["Trend signals", String(dashboard.metrics.trendSignalCount)],
            ["Overdue tasks", String(dashboard.metrics.overdueTaskCount)],
            ["Due today", String(dashboard.metrics.dueTodayCount)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="metric-panel reveal-soft rounded-[1.75rem] p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                {label}
              </p>
              <p className="mt-3 font-serif text-4xl text-stone-900">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-panel reveal-rise reveal-delay-1 rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-kicker">
              Follow-up Autopilot
            </p>
            <h2 className="mt-2 font-serif text-2xl text-stone-900 sm:text-3xl">
              Urgent work across all conversations
            </h2>
            <p className="section-subcopy mt-2 max-w-3xl text-sm">
              {dashboard.metrics.reminderDueCount} reminder
              {dashboard.metrics.reminderDueCount === 1 ? "" : "s"} are already in
              the ready window in this sample.
            </p>
          </div>
          <Link
            href="/demo/follow-ups"
            className="secondary-btn w-full sm:w-auto"
          >
            Open follow-up queue
          </Link>
        </div>

        {urgentTasks.length > 0 ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {urgentTasks.map((task) => (
              <Link
                key={task.id}
                href={`/demo/conversations/${task.conversationId}`}
                className="surface-panel interactive-lift rounded-[1.5rem] p-5 shadow-none"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                      {task.clientName}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-stone-900">
                      {task.taskText}
                    </h3>
                    <p className="mt-1 text-sm text-stone-600">
                      {task.meetingTitle}
                      {" - "}
                      {formatDate(task.meetingDate)}
                    </p>
                  </div>
                  <span className="signal-chip bg-stone-900/95 px-3 py-1 text-white">
                    {task.autopilotState.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="metric-panel rounded-2xl px-4 py-3 text-sm text-stone-700 shadow-none">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                      Due
                    </p>
                    <p className="mt-2">{task.dueDate ?? "No due date set"}</p>
                  </div>
                  <div className="metric-panel rounded-2xl px-4 py-3 text-sm text-stone-700 shadow-none">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                      Reminder
                    </p>
                    <p className="mt-2">
                      {task.reminderAt
                        ? formatDateTime(task.reminderAt)
                        : "No reminder scheduled"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="quiet-panel mt-5 rounded-[1.5rem] border border-dashed border-stone-300 p-5 text-sm text-stone-600 shadow-none">
            No urgent tasks in the sample right now.
          </div>
        )}
      </section>

      <div className="grid gap-5">
        {dashboard.cards.map((card) => (
          <Link
            key={card.conversation.id}
            href={`/demo/conversations/${card.conversation.id}`}
            className="surface-panel interactive-lift reveal-rise reveal-delay-2 rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {formatDate(card.conversation.meetingDate)}
                </p>
                <h2 className="mt-2 font-serif text-2xl text-stone-900 sm:text-3xl">
                  {card.conversation.meetingTitle}
                </h2>
                <p className="mt-1 text-sm text-stone-700">
                  {card.conversation.clientName}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={card.conversation.processingStatus} />
                {card.analysis ? (
                    <span className="signal-chip bg-white/82 px-3 py-1 text-[11px] tracking-[0.16em]">
                    {card.analysis.opportunityLevel} opportunity
                  </span>
                ) : null}
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-700">
              {compactText(
                card.analysis?.summary ?? "Transcript or analysis still in progress.",
                240,
              )}
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="metric-panel rounded-[1.5rem] p-4 text-sm text-stone-700 shadow-none">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Colors
                </p>
                <p className="mt-2">
                  {summarizeList(card.analysis?.analysis.colorMentions ?? [])}
                </p>
              </div>
              <div className="metric-panel rounded-[1.5rem] p-4 text-sm text-stone-700 shadow-none">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Fabrics
                </p>
                <p className="mt-2">
                  {summarizeList(card.analysis?.analysis.fabricMentions ?? [])}
                </p>
              </div>
              <div className="metric-panel rounded-[1.5rem] p-4 text-sm text-stone-700 shadow-none">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Pending tasks
                </p>
                <p className="mt-2">
                  {card.followUpTasks
                    .filter((task) => task.status === "pending")
                    .map((task) => task.taskText)
                    .slice(0, 2)
                    .join(", ") || "No pending tasks"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
