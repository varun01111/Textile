import { getTranscriptionEnv } from "@/lib/env";
import type {
  ConversationSourceLanguage,
  TranscriptSegment,
} from "@/lib/types";

type AssemblyAiTranscript = {
  text: string;
  language_code?: string;
  status: "queued" | "processing" | "completed" | "error";
  error?: string;
  utterances?: Array<{
    speaker?: string | number;
    start?: number;
    end?: number;
    text: string;
  }>;
};

async function parseAssemblyResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`AssemblyAI request failed: ${message}`);
  }

  return (await response.json()) as T;
}

async function sleep(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function buildTranscriptRequest(
  audioUrl: string,
  sourceLanguage: ConversationSourceLanguage,
) {
  const baseRequest = {
    audio_url: audioUrl,
    speaker_labels: true,
    punctuate: true,
    format_text: true,
  };

  if (sourceLanguage === "auto") {
    return {
      ...baseRequest,
      language_detection: true,
    };
  }

  return {
    ...baseRequest,
    language_code: sourceLanguage === "gujarati" ? "gu" : "en",
  };
}

function mapUtterances(
  utterances: AssemblyAiTranscript["utterances"],
): TranscriptSegment[] {
  return (utterances ?? []).map((utterance) => ({
    speaker:
      utterance.speaker === undefined || utterance.speaker === null
        ? null
        : String(utterance.speaker),
    startMs: utterance.start ?? null,
    endMs: utterance.end ?? null,
    text: utterance.text,
  }));
}

export async function transcribeAudioBuffer(
  buffer: ArrayBuffer,
  options: {
    sourceLanguage?: ConversationSourceLanguage;
  } = {},
) {
  const env = getTranscriptionEnv();

  const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
    method: "POST",
    headers: {
      authorization: env.ASSEMBLYAI_API_KEY,
      "content-type": "application/octet-stream",
    },
    body: Buffer.from(buffer),
  });
  const uploadPayload = await parseAssemblyResponse<{ upload_url: string }>(
    uploadResponse,
  );

  const createTranscriptResponse = await fetch(
    "https://api.assemblyai.com/v2/transcript",
    {
      method: "POST",
      headers: {
        authorization: env.ASSEMBLYAI_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(
        buildTranscriptRequest(
          uploadPayload.upload_url,
          options.sourceLanguage ?? "auto",
        ),
      ),
    },
  );
  const createTranscriptPayload = await parseAssemblyResponse<{ id: string }>(
    createTranscriptResponse,
  );

  while (true) {
    const statusResponse = await fetch(
      `https://api.assemblyai.com/v2/transcript/${createTranscriptPayload.id}`,
      {
        headers: {
          authorization: env.ASSEMBLYAI_API_KEY,
        },
      },
    );
    const transcript = await parseAssemblyResponse<AssemblyAiTranscript>(
      statusResponse,
    );

    if (transcript.status === "completed") {
      return {
        fullTranscript: transcript.text,
        detectedLanguage: transcript.language_code ?? null,
        transcriptProvider: "assemblyai",
        rawSegments: mapUtterances(transcript.utterances),
      };
    }

    if (transcript.status === "error") {
      throw new Error(transcript.error ?? "AssemblyAI could not transcribe the audio.");
    }

    await sleep(env.ASSEMBLYAI_POLL_INTERVAL_MS);
  }
}
