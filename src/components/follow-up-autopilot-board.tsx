"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import {
  buildDefaultReminderAt,
  isStructuredDateString,
  toDateTimeInputValue,
} from "@/lib/follow-up-autopilot";
import type {
  FollowUpAutopilotSummary,
  FollowUpAutopilotTask,
  TaskStatus,
} from "@/lib/types";
import { cn, formatDate, formatDateTime, timeAgo } from "@/lib/utils";

type EditableTaskDraft = {
  taskText: string;
  dueDate: string;
  reminderAt: string;
  status: TaskStatus;
};

function buildDraft(task: FollowUpAutopilotTask): EditableTaskDraft {
  return {
    taskText: task.taskText,
    dueDate: task.dueDate ?? "",
    reminderAt: toDateTimeInputValue(task.reminderAt),
    status: task.status,
  };
}

function autopilotStateLabel(task: FollowUpAutopilotTask) {
  switch (task.autopilotState) {
    case "overdue":
      return "Overdue";
    case "due_today":
      return "Due today";
    case "reminder_due":
      return "Reminder ready";
    case "upcoming":
      return "Upcoming";
    case "unscheduled":
      return "Needs schedule";
    case "completed":
      return "Completed";
  }
}

function autopilotStateClasses(task: FollowUpAutopilotTask) {
  switch (task.autopilotState) {
    case "overdue":
      return "bg-rose-100 text-rose-700";
    case "due_today":
      return "bg-amber-100 text-amber-700";
    case "reminder_due":
      return "bg-sky-100 text-sky-700";
    case "upcoming":
      return "bg-emerald-100 text-emerald-700";
    case "unscheduled":
      return "bg-stone-200 text-stone-700";
    case "completed":
      return "bg-stone-900 text-white";
  }
}

function taskMetaLine(task: FollowUpAutopilotTask) {
  if (task.status === "completed") {
    return task.completedAt
      ? `Completed ${timeAgo(task.completedAt)}`
      : "Completed";
  }

  if (task.daysUntilDue === null) {
    return "No structured due date yet";
  }

  if (task.daysUntilDue < 0) {
    return `${Math.abs(task.daysUntilDue)} day${Math.abs(task.daysUntilDue) === 1 ? "" : "s"} overdue`;
  }

  if (task.daysUntilDue === 0) {
    return "Due today";
  }

  if (task.daysUntilDue === 1) {
    return "Due in 1 day";
  }

  return `Due in ${task.daysUntilDue} days`;
}

export function FollowUpAutopilotBoard({
  summary,
}: {
  summary: FollowUpAutopilotSummary;
}) {
  const router = useRouter();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, EditableTaskDraft>>({});
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sections = [
    {
      key: "overdue",
      title: "Overdue",
      description: "Promises that are already past their due date.",
      tasks: summary.overdue,
    },
    {
      key: "dueToday",
      title: "Due today",
      description: "Tasks that should close today.",
      tasks: summary.dueToday,
    },
    {
      key: "reminderDue",
      title: "Reminder ready",
      description: "Tasks whose reminder window is already open.",
      tasks: summary.reminderDue,
    },
    {
      key: "upcoming",
      title: "Upcoming",
      description: "Work that is approaching soon and worth watching.",
      tasks: summary.upcoming,
    },
    {
      key: "unscheduled",
      title: "Needs schedule",
      description: "Tasks that still need a structured due date or reminder.",
      tasks: summary.unscheduled,
    },
    {
      key: "completedRecently",
      title: "Completed this week",
      description: "A quick view of what has already been closed out.",
      tasks: summary.completedRecently,
    },
  ] as const;

  function getDraft(task: FollowUpAutopilotTask) {
    return drafts[task.id] ?? buildDraft(task);
  }

  function startEditing(task: FollowUpAutopilotTask) {
    setEditingTaskId(task.id);
    setStatusMessage(null);
    setErrorMessage(null);
    setDrafts((current) => ({
      ...current,
      [task.id]: current[task.id] ?? buildDraft(task),
    }));
  }

  function updateDraft(
    taskId: string,
    field: keyof EditableTaskDraft,
    value: string,
  ) {
    setDrafts((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] ?? {
          taskText: "",
          dueDate: "",
          reminderAt: "",
          status: "pending" as TaskStatus,
        }),
        [field]: value,
      },
    }));
  }

  async function runTaskAction(
    taskId: string,
    payload: Record<string, unknown>,
    successMessage: string,
  ) {
    setBusyTaskId(taskId);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/follow-up-tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const responsePayload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(responsePayload.error ?? "Could not update follow-up task.");
      }

      setStatusMessage(successMessage);
      setEditingTaskId(null);
      startTransition(() => router.refresh());
    } catch (caughtError) {
      setErrorMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update follow-up task.",
      );
    } finally {
      setBusyTaskId(null);
    }
  }

  return (
    <div className="space-y-6">
      {statusMessage ? (
        <p className="success-notice">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="error-notice">
          {errorMessage}
        </p>
      ) : null}

      {sections.map((section) => (
        <section
          key={section.key}
          className="surface-panel rounded-[2rem] p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker">
                {section.title}
              </p>
              <h2 className="mt-2 font-serif text-3xl text-stone-900">
                {section.tasks.length} task{section.tasks.length === 1 ? "" : "s"}
              </h2>
              <p className="mt-2 text-sm text-stone-600">{section.description}</p>
            </div>
          </div>

          {section.tasks.length > 0 ? (
            <div className="mt-5 space-y-4">
              {section.tasks.map((task) => {
                const draft = getDraft(task);
                const isEditing = editingTaskId === task.id;
                const canAutoSetReminder = isStructuredDateString(draft.dueDate);
                const isBusy = busyTaskId === task.id;

                return (
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
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
                          autopilotStateClasses(task),
                        )}
                      >
                        {autopilotStateLabel(task)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="surface-panel rounded-2xl px-4 py-3 text-sm text-stone-700 shadow-none">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                          Due date
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
                        <p className="mt-2">{taskMetaLine(task)}</p>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="surface-panel mt-4 space-y-3 rounded-[1.5rem] p-4 shadow-none">
                        <input
                          value={draft.taskText}
                          onChange={(event) =>
                            updateDraft(task.id, "taskText", event.target.value)
                          }
                          placeholder="Follow-up task"
                          className="field-control"
                        />
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px]">
                          <input
                            value={draft.dueDate}
                            onChange={(event) =>
                              updateDraft(task.id, "dueDate", event.target.value)
                            }
                            placeholder="YYYY-MM-DD or note"
                            className="field-control"
                          />
                          <input
                            type="datetime-local"
                            value={draft.reminderAt}
                            onChange={(event) =>
                              updateDraft(task.id, "reminderAt", event.target.value)
                            }
                            className="field-control"
                          />
                          <select
                            value={draft.status}
                            onChange={(event) =>
                              updateDraft(task.id, "status", event.target.value)
                            }
                            className="field-control"
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
                          <button
                            type="button"
                            disabled={!canAutoSetReminder}
                            onClick={() => {
                              const automaticReminder = buildDefaultReminderAt(
                                draft.dueDate.trim() || null,
                              );

                              if (!automaticReminder) {
                                return;
                              }

                              updateDraft(
                                task.id,
                                "reminderAt",
                                toDateTimeInputValue(automaticReminder),
                              );
                            }}
                            className="secondary-btn px-4 py-2 text-xs tracking-[0.16em]"
                          >
                            Auto-set reminder
                          </button>
                          <span>
                            Use `YYYY-MM-DD` for due dates to unlock automatic reminder timing.
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void runTaskAction(
                                task.id,
                                {
                                  action: "update",
                                  taskText: draft.taskText,
                                  dueDate: draft.dueDate.trim() ? draft.dueDate.trim() : null,
                                  reminderAt: draft.reminderAt.trim()
                                    ? draft.reminderAt.trim()
                                    : null,
                                  status: draft.status,
                                },
                                "Follow-up task updated.",
                              )
                            }
                            className="primary-btn"
                          >
                            {isBusy ? "Saving..." : "Save changes"}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => {
                              setEditingTaskId(null);
                              setDrafts((current) => ({
                                ...current,
                                [task.id]: buildDraft(task),
                              }));
                            }}
                            className="secondary-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href={`/conversations/${task.conversationId}`}
                          className="secondary-btn px-4 py-2"
                        >
                          Open conversation
                        </Link>
                        {task.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void runTaskAction(
                                  task.id,
                                  { action: "complete" },
                                  "Follow-up task marked complete.",
                                )
                              }
                              className="primary-btn px-4 py-2"
                            >
                              {isBusy ? "Working..." : "Mark complete"}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void runTaskAction(
                                  task.id,
                                  { action: "snooze" },
                                  "Reminder snoozed by one day.",
                                )
                              }
                              className="secondary-btn px-4 py-2"
                            >
                              Snooze 1 day
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void runTaskAction(
                                task.id,
                                { action: "reopen" },
                                "Follow-up task reopened.",
                              )
                            }
                            className="secondary-btn px-4 py-2"
                          >
                            Reopen
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => startEditing(task)}
                          className="secondary-btn px-4 py-2"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="quiet-panel mt-5 rounded-[1.5rem] border border-dashed border-stone-300 p-4 text-sm text-stone-600 shadow-none">
              Nothing in this bucket right now.
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
