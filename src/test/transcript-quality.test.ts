import { describe, expect, it } from "vitest";

import {
  assertTranscriptUsableForAnalysis,
  hasUsableTranscriptContent,
} from "@/lib/transcript-quality";

describe("transcript quality checks", () => {
  it("accepts transcripts with meaningful content", () => {
    const transcript = {
      fullTranscript:
        "Client wants new sage and terracotta samples with pricing by Friday.",
      rawSegments: [
        {
          speaker: "Speaker 1",
          startMs: 0,
          endMs: 4000,
          text: "Client wants new sage and terracotta samples with pricing by Friday.",
        },
      ],
    };

    expect(hasUsableTranscriptContent(transcript)).toBe(true);
    expect(() => assertTranscriptUsableForAnalysis(transcript)).not.toThrow();
  });

  it("rejects empty or near-empty transcripts", () => {
    const transcript = {
      fullTranscript: "  ",
      rawSegments: [],
    };

    expect(hasUsableTranscriptContent(transcript)).toBe(false);
    expect(() => assertTranscriptUsableForAnalysis(transcript)).toThrow(
      "The recording did not produce enough clear speech to analyze.",
    );
  });

  it("rejects transcripts that are too short to trust for analysis", () => {
    const transcript = {
      fullTranscript: "okay yes",
      rawSegments: [
        {
          speaker: "Speaker 1",
          startMs: 0,
          endMs: 2000,
          text: "okay yes",
        },
      ],
    };

    expect(hasUsableTranscriptContent(transcript)).toBe(false);
  });

  it("accepts transcript text even when speaker segments are unavailable", () => {
    const transcript = {
      fullTranscript:
        "The buyer wants Gujarati floral samples and a pricing sheet by Monday.",
      rawSegments: [],
    };

    expect(hasUsableTranscriptContent(transcript)).toBe(true);
    expect(() => assertTranscriptUsableForAnalysis(transcript)).not.toThrow();
  });
});
