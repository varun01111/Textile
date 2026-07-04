import { describe, expect, it } from "vitest";

import { buildConversationSheetRow, getSheetHeaders } from "@/lib/transforms/google-sheet-row";
import { baseAnalysis, baseConversation, baseTasks } from "@/test/fixtures/conversation";

describe("buildConversationSheetRow", () => {
  it("serializes the approved conversation in the fixed column order", () => {
    const row = buildConversationSheetRow({
      appUrl: "https://app.example.com",
      analysis: baseAnalysis,
      audioLink: "https://app.example.com/api/conversations/1/audio",
      conversation: baseConversation,
      followUpTasks: baseTasks,
    });

    expect(row).toHaveLength(getSheetHeaders().length);
    expect(row[0]).toBe("2026-06-29");
    expect(row[1]).toBe("Niya Studio");
    expect(row[5]).toContain("Machinery:");
    expect(row[11]).toContain("Marketing:");
    expect(row[18]).toBe("https://app.example.com/conversations/f3d55250-18cb-4c0a-b8d5-7c7ec6bdaf21");
  });
});
