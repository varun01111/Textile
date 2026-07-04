import Link from "next/link";

import { getDemoFollowUpAutopilotData } from "@/lib/demo-data";
import { formatDate, formatDateTime, timeAgo } from "@/lib/utils";

const sections = [
  {
    key: "overdue",
    title: "Overdue",
    description: "Promises already past their due date.",
  },
  {
    key: "dueToday",
    title: "Due today",
    description: "Tasks that should close today.",
  },
  {
    key: "reminderDue",
    title: "Reminder ready",
    description: "Tasks whose reminder windows are open now.",
  },
  {
    key: "upcoming",
    title: "Upcoming",
    description: "Important work approaching soon.",
  },
  {
    key: "unscheduled",
    title: "Needs schedule",
    description: "Tasks that still need a structured date.",
  },
  {
    key: "completedRecently",
    title: "Completed this week",
    description: "Recent follow-through already closed out.",
  },
] as const;

export default function DemoFollowUpsPage() {
  const autopilot = getDemoFollowUpAutopilotData();
  const pendingTaskCount =
    autopilot.overdue.length +
    autopilot.dueToday.length +
    autopilot.reminderDue.length +
    autopilot.upcoming.length +
    autopilot.unscheduled.length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="hero-panel reveal-rise rounded-[2rem] p-5 sm:rounded-[2.6rem] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-kicker">
              Demo Follow-up Autopilot
            </p>
            <h1 className="mt-3 font-serif text-4xl text-stone-900 sm:text-5xl">
              Active follow-through for every textile conversation
            </h1>
            <p className="section-subcopy mt-3 max-w-3xl text-sm">
              This demo queue shows how extracted tasks become a daily action list
              across buyers, boutiques, and product conversations.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link
              href="/demo/dashboard"
              className="secondary-btn w-full sm:w-auto"
            >
              Back to dashboard
            </Link>
            <Link
              href="/demo/capture"
              className="primary-btn w-full sm:w-auto"
            >
              Open capture walkthrough
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Overdue", String(autopilot.metrics.overdueCount)],
            ["Due today", String(autopilot.metrics.dueTodayCount)],
            ["Reminders ready", String(autopilot.metrics.reminderDueCount)],
            ["Upcoming", String(autopilot.metrics.upcomingCount)],
            ["Open tasks", String(pendingTaskCount)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="metric-panel rounded-[1.75rem] p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                {label}
              </p>
              <p className="mt-3 font-serif text-4xl text-stone-900">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {sections.map((section) => {
        const tasks = autopilot[section.key];

        return (
          <section
            key={section.key}
            className="surface-panel reveal-rise reveal-delay-1 rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6"
          >
            <p className="section-kicker">
              {section.title}
            </p>
            <h2 className="mt-2 font-serif text-2xl text-stone-900 sm:text-3xl">
              {tasks.length} task{tasks.length === 1 ? "" : "s"}
            </h2>
            <p className="mt-2 text-sm text-stone-600">{section.description}</p>

            {tasks.length > 0 ? (
              <div className="mt-5 grid gap-4">
                {tasks.map((task) => (
                  <article
                    key={task.id}
                    className="metric-panel rounded-[1.75rem] p-5 shadow-none"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
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
                      <Link
                        href={`/demo/conversations/${task.conversationId}`}
                        className="secondary-btn w-full px-4 py-2 sm:w-auto"
                      >
                        Open conversation
                      </Link>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="surface-panel rounded-2xl px-4 py-3 text-sm text-stone-700 shadow-none">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                          Due
                        </p>
                        <p className="mt-2">{task.dueDate ?? "No due date set"}</p>
                      </div>
                      <div className="surface-panel rounded-2xl px-4 py-3 text-sm text-stone-700 shadow-none">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                          Reminder
                        </p>
                        <p className="mt-2">
                          {task.reminderAt
                            ? formatDateTime(task.reminderAt)
                            : "No reminder scheduled"}
                        </p>
                      </div>
                      <div className="surface-panel rounded-2xl px-4 py-3 text-sm text-stone-700 shadow-none">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                          Status
                        </p>
                        <p className="mt-2">
                          {task.status === "completed"
                            ? `Completed ${timeAgo(task.completedAt)}`
                            : task.autopilotState.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="quiet-panel mt-5 rounded-[1.5rem] border border-dashed border-stone-300 p-4 text-sm text-stone-600 shadow-none">
                Nothing in this bucket right now.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
