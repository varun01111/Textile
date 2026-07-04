import { describe, expect, it } from "vitest";

import { normalizeOpportunityLevel } from "@/lib/transforms/opportunity";

describe("normalizeOpportunityLevel", () => {
  it("maps fuzzy values to the supported enum", () => {
    expect(normalizeOpportunityLevel("HIGH")).toBe("high");
    expect(normalizeOpportunityLevel("med")).toBe("medium");
    expect(normalizeOpportunityLevel("unknown")).toBe("low");
  });
});
