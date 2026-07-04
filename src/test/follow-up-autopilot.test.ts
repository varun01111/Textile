import { describe, expect, it, vi } from "vitest";

import {
  buildDefaultReminderAt,
  decorateAutopilotTask,
  normalizeReminderInput,
  summarizeAutopilotTasks,
  toDateTimeInputValue,
} from "@/lib/follow-up-autopilot";
import { baseConversation } from "@/test/fixtures/conversation";

describe("follow-up autopilot helpers", () => {
  it("builds a default reminder one day before a structured due date", () => {
    const reminderAt = buildDefaultReminderAt("2026-07-10");

    expect(reminderAt).not.toBeNull();
    expect(toDateTimeInputValue(reminderAt)).toBe("2026-07-09T09:00");
  });

  it("normalizes a datetime-local input into a storable ISO string", () => {
    const normalized = normalizeReminderInput("2026-07-09T09:00");

    expect(normalized).not.toBeNull();
    expect(toDateTimeInputValue(normalized)).toBe("2026-07-09T09:00");
  });

  it("groups overdue, due-today, reminder-ready, upcoming, unscheduled, and completed tasks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-02T10:00:00.000Z"));

    const tasks = [
      decorateAutopilotTask({
        conversation: baseConversation,
        task: {
          id: "task-overdue",
          conversationId: baseConversation.id,
          taskText: "Send overdue swatches",
          dueDate: "2026-07-01",
          status: "pending",
          reminderAt: null,
          completedAt: null,
          createdAt: "2026-06-29T12:05:00.000Z",
          updatedAt: "2026-06-29T12:05:00.000Z",
        },
      }),
      decorateAutopilotTask({
        conversation: baseConversation,
        task: {
          id: "task-due-today",
          conversationId: baseConversation.id,
          taskText: "Call buyer today",
          dueDate: "2026-07-02",
          status: "pending",
          reminderAt: null,
          completedAt: null,
          createdAt: "2026-06-29T12:05:00.000Z",
          updatedAt: "2026-06-29T12:05:00.000Z",
        },
      }),
      decorateAutopilotTask({
        conversation: baseConversation,
        task: {
          id: "task-reminder-ready",
          conversationId: baseConversation.id,
          taskText: "Ping for fabric confirmation",
          dueDate: "2026-07-05",
          status: "pending",
          reminderAt: "2026-07-02T06:00:00.000Z",
          completedAt: null,
          createdAt: "2026-06-29T12:05:00.000Z",
          updatedAt: "2026-06-29T12:05:00.000Z",
        },
      }),
      decorateAutopilotTask({
        conversation: baseConversation,
        task: {
          id: "task-upcoming",
          conversationId: baseConversation.id,
          taskText: "Prepare moodboard",
          dueDate: "2026-07-06",
          status: "pending",
          reminderAt: null,
          completedAt: null,
          createdAt: "2026-06-29T12:05:00.000Z",
          updatedAt: "2026-06-29T12:05:00.000Z",
        },
      }),
      decorateAutopilotTask({
        conversation: baseConversation,
        task: {
          id: "task-unscheduled",
          conversationId: baseConversation.id,
          taskText: "Decide final trims",
          dueDate: "Next Friday",
          status: "pending",
          reminderAt: null,
          completedAt: null,
          createdAt: "2026-06-29T12:05:00.000Z",
          updatedAt: "2026-06-29T12:05:00.000Z",
        },
      }),
      decorateAutopilotTask({
        conversation: baseConversation,
        task: {
          id: "task-completed",
          conversationId: baseConversation.id,
          taskText: "Share pricing note",
          dueDate: "2026-07-01",
          status: "completed",
          reminderAt: null,
          completedAt: "2026-07-01T15:00:00.000Z",
          createdAt: "2026-06-29T12:05:00.000Z",
          updatedAt: "2026-07-01T15:00:00.000Z",
        },
      }),
    ];

    const summary = summarizeAutopilotTasks(tasks);

    expect(summary.overdue).toHaveLength(1);
    expect(summary.dueToday).toHaveLength(1);
    expect(summary.reminderDue).toHaveLength(1);
    expect(summary.upcoming).toHaveLength(1);
    expect(summary.unscheduled).toHaveLength(1);
    expect(summary.completedRecently).toHaveLength(1);
    expect(summary.metrics).toMatchObject({
      overdueCount: 1,
      dueTodayCount: 1,
      reminderDueCount: 1,
      upcomingCount: 1,
      completedThisWeekCount: 1,
    });

    vi.useRealTimers();
  });
});
