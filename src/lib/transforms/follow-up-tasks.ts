import type { AiAnalysis, FollowUpTaskRecord } from "@/lib/types";
import { buildDefaultReminderAt } from "@/lib/follow-up-autopilot";

function normalizeDueDate(value: string | null) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized;
}

export function buildFollowUpTasks(
  conversationId: string,
  analysis: AiAnalysis,
): Array<
  Omit<
    FollowUpTaskRecord,
    "id" | "createdAt" | "updatedAt" | "completedAt"
  >
> {
  return analysis.followUpTasks
    .map((task) => ({
      conversationId,
      taskText: task.task.trim(),
      dueDate: normalizeDueDate(task.dueDate),
      reminderAt: buildDefaultReminderAt(normalizeDueDate(task.dueDate)),
      status: "pending" as const,
    }))
    .filter((task) => task.taskText.length > 0);
}
