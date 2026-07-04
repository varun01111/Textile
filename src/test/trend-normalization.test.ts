import { describe, expect, it } from "vitest";

import { buildMockAnalysis } from "@/lib/mock-analysis";
import { buildTrendMentions } from "@/lib/transforms/trend-normalization";

describe("buildTrendMentions", () => {
  it("creates normalized trend records for approved analyses", () => {
    const mentions = buildTrendMentions("conversation-1", buildMockAnalysis());

    expect(mentions.length).toBeGreaterThan(0);
    expect(mentions[0].normalizedValue).toBe(mentions[0].normalizedValue.toLowerCase());
  });
});
