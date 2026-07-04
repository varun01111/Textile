import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  isToday,
  isValid,
  parseISO,
  set,
  startOfDay,
  subDays,
} from "date-fns";

import type {
  ConversationRecord,
  FollowUpAutopilotState,
  FollowUpAutopilotSummary,
  FollowUpAutopilotTask,
  FollowUpTaskRecord,
} from "@/lib/types";

function parseIsoLikeDate(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = parseISO(trimmed);
  if (!isValid(candidate)) {
    return null;
  }

  return candidate;
}

export function parseTaskDueDate(value: string | null) {
  return parseIsoLikeDate(value);
}

export function parseTaskReminderAt(value: string | null) {
  return parseIsoLikeDate(value);
}

export function isStructuredDateString(value: string | null) {
  return Boolean(parseTaskDueDate(value));
}

export function toDateInputValue(value: string | null) {
  const parsed = parseTaskDueDate(value);
  if (!parsed) {
    return "";
  }

  return format(parsed, "yyyy-MM-dd");
}

export function toDateTimeInputValue(value: string | null) {
  const parsed = parseTaskReminderAt(value);
  if (!parsed) {
    return "";
  }

  return format(parsed, "yyyy-MM-dd'T'HH:mm");
}

export function normalizeDateInput(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeReminderInput(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = parseISO(trimmed);
  if (!isValid(parsed)) {
    return null;
  }

  return parsed.toISOString();
}

export function buildDefaultReminderAt(dueDate: string | null) {
  const parsedDueDate = parseTaskDueDate(dueDate);
  if (!parsedDueDate) {
    return null;
  }

  const reminderBase = subDays(parsedDueDate, 1);
  const reminderAt = set(reminderBase, {
    hours: 9,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  return reminderAt.toISOString();
}

export function applySnoozeWindow(currentReminderAt: string | null, dueDate: string | null) {
  const base = parseTaskReminderAt(currentReminderAt) ?? parseTaskDueDate(dueDate) ?? new Date();
  const snoozed = addDays(base, 1);

  return set(snoozed, {
    hours: 9,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  }).toISOString();
}

export function deriveAutopilotState(task: FollowUpTaskRecord): {
  state: FollowUpAutopilotState;
  dueDateIso: string | null;
  reminderAtIso: string | null;
  daysUntilDue: number | null;
  sortAt: string;
} {
  const now = new Date();
  const todayStart = startOfDay(now);
  const parsedDue = parseTaskDueDate(task.dueDate);
  const parsedReminder = parseTaskReminderAt(task.reminderAt);

  const dueDateIso = parsedDue ? parsedDue.toISOString() : null;
  const reminderAtIso = parsedReminder ? parsedReminder.toISOString() : null;
  const daysUntilDue = parsedDue ? differenceInCalendarDays(parsedDue, now) : null;

  if (task.status === "completed") {
    return {
      state: "completed",
      dueDateIso,
      reminderAtIso,
      daysUntilDue,
      sortAt: task.completedAt ?? task.updatedAt,
    };
  }

  if (parsedDue && isBefore(parsedDue, todayStart)) {
    return {
      state: "overdue",
      dueDateIso,
      reminderAtIso,
      daysUntilDue,
      sortAt: parsedDue.toISOString(),
    };
  }

  if (parsedDue && isToday(parsedDue)) {
    return {
      state: "due_today",
      dueDateIso,
      reminderAtIso,
      daysUntilDue,
      sortAt: parsedDue.toISOString(),
    };
  }

  if (parsedReminder && parsedReminder <= now) {
    return {
      state: "reminder_due",
      dueDateIso,
      reminderAtIso,
      daysUntilDue,
      sortAt: parsedReminder.toISOString(),
    };
  }

  if (
    (parsedDue && differenceInCalendarDays(parsedDue, now) <= 7) ||
    (parsedReminder && differenceInCalendarDays(parsedReminder, now) <= 2)
  ) {
    return {
      state: "upcoming",
      dueDateIso,
      reminderAtIso,
      daysUntilDue,
      sortAt: parsedReminder?.toISOString() ?? parsedDue?.toISOString() ?? task.createdAt,
    };
  }

  return {
    state: "unscheduled",
    dueDateIso,
    reminderAtIso,
    daysUntilDue,
    sortAt: parsedReminder?.toISOString() ?? parsedDue?.toISOString() ?? task.createdAt,
  };
}

export function decorateAutopilotTask(args: {
  task: FollowUpTaskRecord;
  conversation: ConversationRecord;
}): FollowUpAutopilotTask {
  const derived = deriveAutopilotState(args.task);

  return {
    ...args.task,
    clientName: args.conversation.clientName,
    meetingTitle: args.conversation.meetingTitle,
    meetingDate: args.conversation.meetingDate,
    autopilotState: derived.state,
    dueDateIso: derived.dueDateIso,
    reminderAtIso: derived.reminderAtIso,
    sortAt: derived.sortAt,
    daysUntilDue: derived.daysUntilDue,
  };
}

function bySortAtAscending(left: FollowUpAutopilotTask, right: FollowUpAutopilotTask) {
  return left.sortAt.localeCompare(right.sortAt);
}

function byCompletedDescending(left: FollowUpAutopilotTask, right: FollowUpAutopilotTask) {
  return (right.completedAt ?? right.updatedAt).localeCompare(
    left.completedAt ?? left.updatedAt,
  );
}

export function summarizeAutopilotTasks(
  tasks: FollowUpAutopilotTask[],
): FollowUpAutopilotSummary {
  const summary: FollowUpAutopilotSummary = {
    overdue: [],
    dueToday: [],
    reminderDue: [],
    upcoming: [],
    unscheduled: [],
    completedRecently: [],
    metrics: {
      overdueCount: 0,
      dueTodayCount: 0,
      reminderDueCount: 0,
      upcomingCount: 0,
      completedThisWeekCount: 0,
    },
  };

  const oneWeekAgo = subDays(new Date(), 7);

  for (const task of tasks) {
    switch (task.autopilotState) {
      case "overdue":
        summary.overdue.push(task);
        break;
      case "due_today":
        summary.dueToday.push(task);
        break;
      case "reminder_due":
        summary.reminderDue.push(task);
        break;
      case "upcoming":
        summary.upcoming.push(task);
        break;
      case "unscheduled":
        summary.unscheduled.push(task);
        break;
      case "completed": {
        const completedAt = parseTaskReminderAt(task.completedAt);
        if (completedAt && completedAt >= oneWeekAgo) {
          summary.completedRecently.push(task);
        }
        break;
      }
    }
  }

  summary.overdue.sort(bySortAtAscending);
  summary.dueToday.sort(bySortAtAscending);
  summary.reminderDue.sort(bySortAtAscending);
  summary.upcoming.sort(bySortAtAscending);
  summary.unscheduled.sort(bySortAtAscending);
  summary.completedRecently.sort(byCompletedDescending);

  summary.metrics = {
    overdueCount: summary.overdue.length,
    dueTodayCount: summary.dueToday.length,
    reminderDueCount: summary.reminderDue.length,
    upcomingCount: summary.upcoming.length,
    completedThisWeekCount: summary.completedRecently.length,
  };

  return summary;
}
