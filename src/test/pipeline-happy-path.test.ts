import { describe, expect, it } from "vitest";

import { buildMockAnalysis } from "@/lib/mock-analysis";
import { buildFollowUpTasks } from "@/lib/transforms/follow-up-tasks";
import { buildTrendMentions } from "@/lib/transforms/trend-normalization";
import { buildConversationSheetRow } from "@/lib/transforms/google-sheet-row";
import { baseConversation } from "@/test/fixtures/conversation";

describe("mock analysis pipeline", () => {
  it("produces tasks, trends, and a sheets row from one structured analysis", () => {
    const analysis = buildMockAnalysis();
    const tasks = buildFollowUpTasks(baseConversation.id, analysis).map((task, index) => ({
      id: `task-${index}`,
      conversationId: task.conversationId,
      taskText: task.taskText,
      dueDate: task.dueDate,
      status: task.status,
      reminderAt: null,
      completedAt: null,
      createdAt: "2026-06-29T12:05:00.000Z",
      updatedAt: "2026-06-29T12:05:00.000Z",
    }));
    const trends = buildTrendMentions(baseConversation.id, analysis);

    expect(tasks.length).toBeGreaterThan(0);
    expect(trends.some((trend) => trend.category === "color")).toBe(true);
    expect(trends.some((trend) => trend.category === "marketing_strategy")).toBe(true);

    const row = buildConversationSheetRow({
      appUrl: "https://app.example.com",
      analysis: {
        id: "analysis-1",
        conversationId: baseConversation.id,
        analysis,
        summary: analysis.summary,
        opportunityLevel: analysis.opportunityLevel,
        nextAction: analysis.nextAction,
        providerModel: "mock",
        createdAt: "2026-06-29T12:05:00.000Z",
        updatedAt: "2026-06-29T12:05:00.000Z",
      },
      audioLink: "https://app.example.com/api/conversations/1/audio",
      conversation: baseConversation,
      followUpTasks: tasks,
    });

    expect(row[16]).toBe("high");
  });
});
