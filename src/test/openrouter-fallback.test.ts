import { describe, expect, it } from "vitest";

import { shouldTryBackupOpenRouterKey } from "@/lib/vendors/openrouter-analysis";

describe("OpenRouter key fallback", () => {
  it("retries on insufficient credits and rate limits", () => {
    expect(shouldTryBackupOpenRouterKey({ status: 402 })).toBe(true);
    expect(shouldTryBackupOpenRouterKey({ status: 429 })).toBe(true);
    expect(shouldTryBackupOpenRouterKey({ status: 503 })).toBe(true);
  });

  it("does not retry on client-side request errors", () => {
    expect(shouldTryBackupOpenRouterKey({ status: 400 })).toBe(false);
    expect(shouldTryBackupOpenRouterKey({ status: 401 })).toBe(false);
    expect(shouldTryBackupOpenRouterKey(new Error("boom"))).toBe(false);
  });
});
