import { describe, expect, it } from "vitest";

import { parseAiAnalysis } from "@/lib/validation/ai-analysis";

describe("parseAiAnalysis", () => {
  it("accepts structured analysis and normalizes opportunity level", () => {
    const result = parseAiAnalysis({
      summary: "Useful summary",
      importantBusinessPoints: ["Point 1"],
      clientPreferences: [],
      designIdeas: [],
      fabricMentions: [],
      colorMentions: [],
      patternStyleMentions: [],
      marketTrendInsights: [],
      pricingDiscussion: [],
      possibleOrders: [],
      followUpTasks: [{ task: "Send quote", dueDate: null }],
      deadlines: [],
      clientConcerns: [],
      newOpportunities: [],
      machineryOpportunities: [],
      sourcingOpportunities: [],
      marketingStrategySuggestions: [],
      salesStrategySuggestions: [],
      ignoredCasualTalk: [],
      opportunityLevel: "MED",
      nextAction: "Send quote",
    });

    expect(result.opportunityLevel).toBe("medium");
  });

  it("rejects missing summary", () => {
    expect(() =>
      parseAiAnalysis({
        summary: "",
        opportunityLevel: "high",
        nextAction: "Anything",
      }),
    ).toThrow();
  });
});
