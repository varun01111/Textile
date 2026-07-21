import type { TranscriptRecord } from "@/lib/types";

const MIN_TRANSCRIPT_CHARACTERS = 12;
const MIN_TRANSCRIPT_WORDS = 3;

function normalizeTranscriptText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function countMeaningfulWords(value: string) {
  return normalizeTranscriptText(value)
    .split(" ")
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

function getTranscriptBody(
  transcript: Pick<TranscriptRecord, "fullTranscript" | "rawSegments">,
) {
  const primaryText = normalizeTranscriptText(transcript.fullTranscript);
  if (primaryText.length > 0) {
    return primaryText;
  }

  return normalizeTranscriptText(
    (transcript.rawSegments ?? []).map((segment) => segment.text).join(" "),
  );
}

export function hasUsableTranscriptContent(
  transcript: Pick<TranscriptRecord, "fullTranscript" | "rawSegments">,
) {
  const normalizedText = getTranscriptBody(transcript);
  const wordCount = countMeaningfulWords(normalizedText);

  return (
    normalizedText.length >= MIN_TRANSCRIPT_CHARACTERS &&
    wordCount >= MIN_TRANSCRIPT_WORDS
  );
}

export function assertTranscriptUsableForAnalysis(
  transcript: Pick<TranscriptRecord, "fullTranscript" | "rawSegments">,
) {
  if (!hasUsableTranscriptContent(transcript)) {
    throw new Error(
      "The recording did not produce enough clear speech to analyze. On phones, keep the app open with the screen awake, or record in your phone's recorder app and upload the file after the meeting.",
    );
  }
}
