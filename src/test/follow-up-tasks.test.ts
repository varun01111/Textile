import { describe, expect, it } from "vitest";

import { toDateTimeInputValue } from "@/lib/follow-up-autopilot";
import { buildMockAnalysis } from "@/lib/mock-analysis";
import { buildFollowUpTasks } from "@/lib/transforms/follow-up-tasks";

describe("buildFollowUpTasks", () => {
  it("builds pending tasks from the structured analysis", () => {
    const tasks = buildFollowUpTasks("conversation-1", buildMockAnalysis());

    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({
      conversationId: "conversation-1",
      status: "pending",
    });
  });

  it("creates a default reminder when the AI returns a structured due date", () => {
    const analysis = buildMockAnalysis();
    analysis.followUpTasks = [
      {
        task: "Confirm final sample shipment",
        dueDate: "2026-07-10",
      },
    ];

    const tasks = buildFollowUpTasks("conversation-1", analysis);

    expect(tasks[0].reminderAt).not.toBeNull();
    expect(toDateTimeInputValue(tasks[0].reminderAt)).toBe("2026-07-09T09:00");
  });
});
