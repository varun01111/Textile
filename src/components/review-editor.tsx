"use client";

import type { Dispatch, SetStateAction } from "react";
import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import {
  buildDefaultReminderAt,
  isStructuredDateString,
  toDateTimeInputValue,
} from "@/lib/follow-up-autopilot";
import type { ConversationDetail, OpportunityLevel } from "@/lib/types";
import { joinLines, splitLines } from "@/lib/utils";

type EditableTask = {
  id?: string;
  taskText: string;
  dueDate: string;
  reminderAt: string;
  status: "pending" | "completed";
};

function arrayField(initialValue: string[]) {
  return joinLines(initialValue);
}

function dueDatesFromTasks(
  tasks: Array<{ dueDate: string | null }>,
  fallback: string[],
) {
  const fromTasks = tasks
    .map((task) => task.dueDate)
    .filter((value): value is string => Boolean(value));

  return fromTasks.length > 0 ? joinLines(fromTasks) : joinLines(fallback);
}

export function ReviewEditor({ detail }: { detail: ConversationDetail }) {
  const router = useRouter();
  const initialAnalysis = detail.analysis?.analysis;
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [summary, setSummary] = useState(initialAnalysis?.summary ?? "");
  const [importantBusinessPoints, setImportantBusinessPoints] = useState(
    arrayField(initialAnalysis?.importantBusinessPoints ?? []),
  );
  const [clientPreferences, setClientPreferences] = useState(
    arrayField(initialAnalysis?.clientPreferences ?? []),
  );
  const [designIdeas, setDesignIdeas] = useState(
    arrayField(initialAnalysis?.designIdeas ?? []),
  );
  const [fabricMentions, setFabricMentions] = useState(
    arrayField(initialAnalysis?.fabricMentions ?? []),
  );
  const [colorMentions, setColorMentions] = useState(
    arrayField(initialAnalysis?.colorMentions ?? []),
  );
  const [patternStyleMentions, setPatternStyleMentions] = useState(
    arrayField(initialAnalysis?.patternStyleMentions ?? []),
  );
  const [marketTrendInsights, setMarketTrendInsights] = useState(
    arrayField(initialAnalysis?.marketTrendInsights ?? []),
  );
  const [pricingDiscussion, setPricingDiscussion] = useState(
    arrayField(initialAnalysis?.pricingDiscussion ?? []),
  );
  const [possibleOrders, setPossibleOrders] = useState(
    arrayField(initialAnalysis?.possibleOrders ?? []),
  );
  const [clientConcerns, setClientConcerns] = useState(
    arrayField(initialAnalysis?.clientConcerns ?? []),
  );
  const [newOpportunities, setNewOpportunities] = useState(
    arrayField(initialAnalysis?.newOpportunities ?? []),
  );
  const [machineryOpportunities, setMachineryOpportunities] = useState(
    arrayField(initialAnalysis?.machineryOpportunities ?? []),
  );
  const [sourcingOpportunities, setSourcingOpportunities] = useState(
    arrayField(initialAnalysis?.sourcingOpportunities ?? []),
  );
  const [marketingStrategySuggestions, setMarketingStrategySuggestions] = useState(
    arrayField(initialAnalysis?.marketingStrategySuggestions ?? []),
  );
  const [salesStrategySuggestions, setSalesStrategySuggestions] = useState(
    arrayField(initialAnalysis?.salesStrategySuggestions ?? []),
  );
  const [ignoredCasualTalk, setIgnoredCasualTalk] = useState(
    arrayField(initialAnalysis?.ignoredCasualTalk ?? []),
  );
  const [deadlines, setDeadlines] = useState(
    dueDatesFromTasks(detail.followUpTasks, initialAnalysis?.deadlines ?? []),
  );
  const [nextAction, setNextAction] = useState(initialAnalysis?.nextAction ?? "");
  const [opportunityLevel, setOpportunityLevel] = useState<OpportunityLevel>(
    initialAnalysis?.opportunityLevel ?? "medium",
  );
  const [tasks, setTasks] = useState<EditableTask[]>(
    detail.followUpTasks.length > 0
      ? detail.followUpTasks.map((task) => ({
          id: task.id,
          taskText: task.taskText,
          dueDate: task.dueDate ?? "",
          reminderAt: toDateTimeInputValue(task.reminderAt),
          status: task.status,
        }))
      : [{ taskText: "", dueDate: "", reminderAt: "", status: "pending" }],
  );

  const transcriptSegments = useMemo(
    () => detail.transcript?.rawSegments ?? [],
    [detail.transcript?.rawSegments],
  );
  const textareaSections: Array<{
    label: string;
    value: string;
    setter: Dispatch<SetStateAction<string>>;
  }> = [
    {
      label: "Important business points",
      value: importantBusinessPoints,
      setter: setImportantBusinessPoints,
    },
    {
      label: "Client preferences",
      value: clientPreferences,
      setter: setClientPreferences,
    },
    { label: "Design ideas", value: designIdeas, setter: setDesignIdeas },
    { label: "Fabric mentions", value: fabricMentions, setter: setFabricMentions },
    { label: "Color mentions", value: colorMentions, setter: setColorMentions },
    {
      label: "Pattern and style mentions",
      value: patternStyleMentions,
      setter: setPatternStyleMentions,
    },
    {
      label: "Market trend insights",
      value: marketTrendInsights,
      setter: setMarketTrendInsights,
    },
    {
      label: "Pricing discussion",
      value: pricingDiscussion,
      setter: setPricingDiscussion,
    },
    { label: "Possible orders", value: possibleOrders, setter: setPossibleOrders },
    { label: "Client concerns", value: clientConcerns, setter: setClientConcerns },
    {
      label: "New opportunities",
      value: newOpportunities,
      setter: setNewOpportunities,
    },
    {
      label: "Machinery opportunities",
      value: machineryOpportunities,
      setter: setMachineryOpportunities,
    },
    {
      label: "Sourcing opportunities",
      value: sourcingOpportunities,
      setter: setSourcingOpportunities,
    },
    {
      label: "Marketing strategy suggestions",
      value: marketingStrategySuggestions,
      setter: setMarketingStrategySuggestions,
    },
    {
      label: "Sales strategy suggestions",
      value: salesStrategySuggestions,
      setter: setSalesStrategySuggestions,
    },
    {
      label: "Ignored casual talk",
      value: ignoredCasualTalk,
      setter: setIgnoredCasualTalk,
    },
  ];

  const analysisPayload = useMemo(() => {
    const normalizedTasks = tasks
      .filter((task) => task.taskText.trim().length > 0)
      .map((task) => ({
        task: task.taskText.trim(),
        dueDate: task.dueDate.trim() ? task.dueDate.trim() : null,
      }));

    return {
      summary: summary.trim(),
      importantBusinessPoints: splitLines(importantBusinessPoints),
      clientPreferences: splitLines(clientPreferences),
      designIdeas: splitLines(designIdeas),
      fabricMentions: splitLines(fabricMentions),
      colorMentions: splitLines(colorMentions),
      patternStyleMentions: splitLines(patternStyleMentions),
      marketTrendInsights: splitLines(marketTrendInsights),
      pricingDiscussion: splitLines(pricingDiscussion),
      possibleOrders: splitLines(possibleOrders),
      followUpTasks: normalizedTasks,
      deadlines: splitLines(deadlines),
      clientConcerns: splitLines(clientConcerns),
      newOpportunities: splitLines(newOpportunities),
      machineryOpportunities: splitLines(machineryOpportunities),
      sourcingOpportunities: splitLines(sourcingOpportunities),
      marketingStrategySuggestions: splitLines(marketingStrategySuggestions),
      salesStrategySuggestions: splitLines(salesStrategySuggestions),
      ignoredCasualTalk: splitLines(ignoredCasualTalk),
      opportunityLevel,
      nextAction: nextAction.trim(),
    };
  }, [
    clientConcerns,
    clientPreferences,
    colorMentions,
    deadlines,
    designIdeas,
    fabricMentions,
    ignoredCasualTalk,
    importantBusinessPoints,
    machineryOpportunities,
    marketingStrategySuggestions,
    marketTrendInsights,
    nextAction,
    salesStrategySuggestions,
    opportunityLevel,
    patternStyleMentions,
    possibleOrders,
    pricingDiscussion,
    sourcingOpportunities,
    summary,
    tasks,
    newOpportunities,
  ]);

  async function persistReview() {
    const response = await fetch(`/api/conversations/${detail.conversation.id}/review`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        analysis: analysisPayload,
        tasks: tasks
          .filter((task) => task.taskText.trim().length > 0)
          .map((task) => ({
            taskText: task.taskText.trim(),
            dueDate: task.dueDate.trim() ? task.dueDate.trim() : null,
            reminderAt: task.reminderAt.trim() ? task.reminderAt.trim() : null,
            status: task.status,
          })),
      }),
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not save review changes.");
    }
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await persistReview();
      setStatusMessage("Review changes saved.");
      startTransition(() => router.refresh());
    } catch (caughtError) {
      setErrorMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save review changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    setApproving(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await persistReview();
      const response = await fetch(
        `/api/conversations/${detail.conversation.id}/approve-and-export`,
        {
          method: "POST",
        },
      );
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Export failed.");
      }

      setStatusMessage("Conversation approved and exported to Google Sheets.");
      startTransition(() => router.refresh());
    } catch (caughtError) {
      setErrorMessage(
        caughtError instanceof Error ? caughtError.message : "Export failed.",
      );
    } finally {
      setApproving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete the audio, transcript, and analysis for this conversation?",
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/conversations/${detail.conversation.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as {
        error?: string;
        warning?: string | null;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Delete failed.");
      }

      setStatusMessage(
        payload.warning ??
          "Conversation assets deleted. The Google Sheets row, if any, was left untouched.",
      );
      startTransition(() => router.refresh());
    } catch (caughtError) {
      setErrorMessage(
        caughtError instanceof Error ? caughtError.message : "Delete failed.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function updateTask(
    index: number,
    field: keyof Pick<EditableTask, "taskText" | "dueDate" | "reminderAt" | "status">,
    value: string,
  ) {
    setTasks((current) =>
      current.map((task, taskIndex) =>
        taskIndex === index ? { ...task, [field]: value } : task,
      ),
    );
  }

  function removeTask(index: number) {
    setTasks((current) => current.filter((_, taskIndex) => taskIndex !== index));
  }

  function setAutomaticReminder(index: number) {
    setTasks((current) =>
      current.map((task, taskIndex) => {
        if (taskIndex !== index) {
          return task;
        }

        const reminderAt = buildDefaultReminderAt(task.dueDate.trim() || null);
        if (!reminderAt) {
          return task;
        }

        return {
          ...task,
          reminderAt: toDateTimeInputValue(reminderAt),
        };
      }),
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <section className="hero-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker">
                Review
              </p>
              <h2 className="mt-2 font-serif text-3xl text-stone-900 sm:text-4xl">
                {detail.conversation.meetingTitle}
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                {detail.conversation.clientName}
                {" - "}
                {detail.conversation.meetingDate}
              </p>
            </div>
            <StatusBadge status={detail.conversation.processingStatus} />
          </div>

          <label className="mt-6 block text-sm font-medium text-stone-800">
            Summary
            <textarea
              rows={4}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              className="field-control mt-2 min-h-[7rem]"
            />
          </label>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-stone-800">
              Opportunity level
              <select
                value={opportunityLevel}
                onChange={(event) =>
                  setOpportunityLevel(event.target.value as OpportunityLevel)
                }
                className="field-control mt-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="text-sm font-medium text-stone-800">
              Next action
              <input
                value={nextAction}
                onChange={(event) => setNextAction(event.target.value)}
                className="field-control mt-2"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {textareaSections.map((section) => (
              <label key={section.label} className="text-sm font-medium text-stone-800">
                {section.label}
                <textarea
                  rows={5}
                  value={section.value}
                  onChange={(event) => section.setter(event.target.value)}
                  className="field-control mt-2 min-h-[9rem]"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="surface-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-900">Follow-up tasks</p>
              <p className="mt-1 text-sm text-stone-600">
                These tasks are editable before the final export.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setTasks((current) => [
                  ...current,
                  { taskText: "", dueDate: "", reminderAt: "", status: "pending" },
                ])
              }
              className="secondary-btn w-full px-4 py-2 text-xs tracking-[0.16em] sm:w-auto"
            >
              Add task
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {tasks.map((task, index) => (
              <div
                key={`${task.id ?? "new"}-${index}`}
                className="metric-panel space-y-3 rounded-[1.5rem] p-4 shadow-none"
              >
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_210px_150px]">
                  <input
                    value={task.taskText}
                    onChange={(event) => updateTask(index, "taskText", event.target.value)}
                    placeholder="Follow-up task"
                    className="field-control"
                  />
                  <input
                    value={task.dueDate}
                    onChange={(event) => updateTask(index, "dueDate", event.target.value)}
                    placeholder="YYYY-MM-DD or note"
                    className="field-control"
                  />
                  <input
                    type="datetime-local"
                    value={task.reminderAt}
                    onChange={(event) => updateTask(index, "reminderAt", event.target.value)}
                    className="field-control"
                  />
                  <select
                    value={task.status}
                    onChange={(event) => updateTask(index, "status", event.target.value)}
                    className="field-control"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                  <button
                    type="button"
                    disabled={!isStructuredDateString(task.dueDate)}
                    onClick={() => setAutomaticReminder(index)}
                    className="secondary-btn w-full px-4 py-2 text-xs tracking-[0.16em] sm:w-auto"
                  >
                    Auto-set reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="danger-btn w-full px-4 py-2 text-xs tracking-[0.16em] sm:w-auto"
                  >
                    Remove
                  </button>
                  <span>
                    Use `YYYY-MM-DD` for due dates to create reliable reminder timing.
                  </span>
                </div>
              </div>
            ))}
          </div>

          <label className="mt-6 block text-sm font-medium text-stone-800">
            Deadlines
            <textarea
              rows={3}
              value={deadlines}
              onChange={(event) => setDeadlines(event.target.value)}
              className="field-control mt-2 min-h-[6rem]"
            />
          </label>

          {statusMessage ? (
            <p className="success-notice mt-5">
              {statusMessage}
            </p>
          ) : null}
          {errorMessage ? (
            <p className="error-notice mt-5">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || approving}
              className="secondary-btn w-full sm:w-auto"
            >
              {saving ? "Saving..." : "Save review"}
            </button>
            <button
              type="button"
              onClick={() => void handleApprove()}
              disabled={approving || saving}
              className="primary-btn w-full sm:w-auto"
            >
              {approving ? "Exporting..." : "Approve & export"}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="danger-btn w-full sm:w-auto"
            >
              {deleting ? "Deleting..." : "Delete assets"}
            </button>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="surface-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
          <p className="text-sm font-semibold text-stone-900">Transcript</p>
          <p className="mt-1 text-sm text-stone-600">
            Stable link:
            {" "}
            <code className="break-all">/conversations/{detail.conversation.id}</code>
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Detected language:
            {" "}
            <strong>{detail.transcript?.detectedLanguage ?? "Pending"}</strong>
          </p>
          <div className="mt-5 space-y-4">
            {transcriptSegments.length > 0 ? (
              transcriptSegments.map((segment, index) => (
                <div
                  key={`${segment.startMs ?? index}-${index}`}
                  className="metric-panel rounded-[1.5rem] p-4 shadow-none"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    {segment.speaker ?? "Speaker"}
                  </p>
                  <p className="mt-2 break-words text-sm leading-7 text-stone-700">{segment.text}</p>
                </div>
              ))
            ) : (
              <p className="quiet-panel rounded-[1.5rem] p-4 text-sm text-stone-600 shadow-none">
                {detail.transcript?.fullTranscript ?? "Transcript not available yet."}
              </p>
            )}
          </div>
        </section>

        {detail.exportRecord ? (
          <section className="accent-panel rounded-[1.75rem] p-5 shadow-none sm:rounded-[2rem] sm:p-6">
            <p className="text-sm font-semibold text-stone-900">Sheet export</p>
            <p className="mt-2 text-sm text-stone-700">
              Status:
              {" "}
              <strong>{detail.exportRecord.exportStatus}</strong>
            </p>
            <p className="mt-1 text-sm text-stone-700">
              Row number:
              {" "}
              <strong>{detail.exportRecord.rowNumber ?? "-"}</strong>
            </p>
            {detail.exportRecord.errorMessage ? (
              <p className="error-notice mt-3">
                {detail.exportRecord.errorMessage}
              </p>
            ) : null}
          </section>
        ) : null}
      </aside>
    </div>
  );
}
