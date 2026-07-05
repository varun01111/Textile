import { afterEach, describe, expect, it } from "vitest";

import { getTranscriptionEnv, hasTranscriptionEnv } from "@/lib/env";

const originalAssemblyAiApiKey = process.env.ASSEMBLYAI_API_KEY;
const originalAssemblyAiPollInterval = process.env.ASSEMBLYAI_POLL_INTERVAL_MS;

afterEach(() => {
  process.env.ASSEMBLYAI_API_KEY = originalAssemblyAiApiKey;
  process.env.ASSEMBLYAI_POLL_INTERVAL_MS = originalAssemblyAiPollInterval;
});

describe("environment normalization", () => {
  it("treats whitespace-only AssemblyAI keys as missing", () => {
    process.env.ASSEMBLYAI_API_KEY = "   ";
    process.env.ASSEMBLYAI_POLL_INTERVAL_MS = "3000";

    expect(hasTranscriptionEnv()).toBe(false);
  });

  it("trims and unwraps quoted AssemblyAI keys", () => {
    process.env.ASSEMBLYAI_API_KEY = '  "demo-key"  ';
    process.env.ASSEMBLYAI_POLL_INTERVAL_MS = " 3000 ";

    expect(hasTranscriptionEnv()).toBe(true);
    expect(getTranscriptionEnv().ASSEMBLYAI_API_KEY).toBe("demo-key");
    expect(getTranscriptionEnv().ASSEMBLYAI_POLL_INTERVAL_MS).toBe(3000);
  });
});
