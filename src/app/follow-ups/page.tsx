import Link from "next/link";

import { FollowUpAutopilotBoard } from "@/components/follow-up-autopilot-board";
import { SetupPanel } from "@/components/setup-panel";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getFollowUpAutopilotData } from "@/lib/conversations";
import { hasPublicSupabaseEnv } from "@/lib/env";

export default async function FollowUpsPage() {
  if (!hasPublicSupabaseEnv()) {
    return <SetupPanel />;
  }

  const user = await requireAuthenticatedUser();
  const autopilot = await getFollowUpAutopilotData(user.id);
  const pendingTaskCount =
    autopilot.overdue.length +
    autopilot.dueToday.length +
    autopilot.reminderDue.length +
    autopilot.upcoming.length +
    autopilot.unscheduled.length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="hero-panel rounded-[2rem] p-5 sm:rounded-[2.6rem] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-kicker">
              Follow-up Autopilot
            </p>
            <h1 className="mt-3 font-serif text-4xl text-stone-900 sm:text-5xl">
              Active follow-through for every textile conversation
            </h1>
            <p className="section-subcopy mt-3 max-w-3xl text-sm">
              Keep overdue tasks, due-today work, and reminder nudges in one place so important client promises do not slip.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard"
              className="secondary-btn w-full sm:w-auto"
            >
              Back to dashboard
            </Link>
            <Link
              href="/capture"
              className="primary-btn w-full sm:w-auto"
            >
              Capture new conversation
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

      {pendingTaskCount === 0 && autopilot.completedRecently.length === 0 ? (
        <section className="quiet-panel rounded-[1.75rem] border border-dashed border-stone-300 p-6 text-center shadow-none sm:rounded-[2rem] sm:p-8">
          <h2 className="font-serif text-2xl text-stone-900 sm:text-3xl">No follow-up queue yet</h2>
          <p className="section-subcopy mt-3 text-sm">
            Once reviewed conversations start generating tasks, this page will become your action hub for reminders, snoozes, and completions.
          </p>
        </section>
      ) : (
        <FollowUpAutopilotBoard summary={autopilot} />
      )}
    </div>
  );
}
