import OpenAI from "openai";

import { getAiEnv, getAppUrl } from "@/lib/env";
import type { AiAnalysis, ConversationRecord, TranscriptRecord } from "@/lib/types";
import {
  aiAnalysisJsonSchema,
  parseAiAnalysis,
} from "@/lib/validation/ai-analysis";

const clientCache = new Map<string, OpenAI>();

function getClient(apiKey: string) {
  const cachedClient = clientCache.get(apiKey);
  if (cachedClient) {
    return cachedClient;
  }

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": getAppUrl(),
      "X-OpenRouter-Title": "Textile Client Conversation Intelligence",
    },
  });
  clientCache.set(apiKey, client);

  return client;
}

function getOrderedApiKeys() {
  const env = getAiEnv();
  return [
    env.OPENROUTER_API_KEY,
    env.OPENROUTER_API_KEY_BACKUP,
  ].filter((value): value is string => Boolean(value));
}

export function shouldTryBackupOpenRouterKey(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return false;
  }

  const status = error.status;
  return (
    typeof status === "number" &&
    (status === 402 || status === 429 || status >= 500)
  );
}

function buildPrompt(
  conversation: ConversationRecord,
  transcript: TranscriptRecord,
) {
  return `
You are analyzing a textile and fashion client conversation for business intelligence.
The transcript may be in Gujarati, English, or mixed Gujarati-English business language.

Return only valid JSON that matches the provided schema exactly.
Write every output field in English only.

Focus areas:
- future textile designs
- colors that may trend
- fabrics and materials clients prefer
- patterns, prints, embroidery, cuts, and styles
- market demand
- customer preferences
- pricing discussions
- business opportunities
- machinery or equipment upgrade opportunities
- sourcing or supplier opportunities
- marketing strategy changes, including physical vs digital channel advice
- sales strategy, distribution, or commercial positioning advice
- follow-up tasks and deadlines

Rules:
- Stay grounded in the transcript and metadata. Do not invent details.
- Separate important business content from casual conversation.
- Keep each list item concise and actionable.
- Use plain English.
- If no useful data exists for a field, return an empty array.
- followUpTasks must be objects with { "task": string, "dueDate": string | null }.
- If a deadline is clear enough to schedule, prefer dueDate in YYYY-MM-DD format.
- If the transcript only implies a vague deadline, keep dueDate null and place the phrase in deadlines instead.
- opportunityLevel must be one of: low, medium, high.

Conversation metadata:
- clientName: ${conversation.clientName}
- meetingTitle: ${conversation.meetingTitle}
- meetingDate: ${conversation.meetingDate}
- conversationType: ${conversation.conversationType}
- transcriptLanguage: ${transcript.detectedLanguage ?? "unknown"}

Transcript:
${transcript.fullTranscript}
`;
}

export async function analyzeConversation({
  conversation,
  transcript,
}: {
  conversation: ConversationRecord;
  transcript: TranscriptRecord;
}): Promise<AiAnalysis> {
  const env = getAiEnv();
  const apiKeys = getOrderedApiKeys();
  let lastError: unknown = null;

  for (let index = 0; index < apiKeys.length; index += 1) {
    const apiKey = apiKeys[index];
    const hasBackupRemaining = index < apiKeys.length - 1;
    const client = getClient(apiKey);

    try {
      const completion = await client.chat.completions.create({
        model: env.OPENROUTER_MODEL,
        temperature: 0.1,
        provider: {
          require_parameters: true,
          data_collection: "deny",
        },
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "textile_conversation_intelligence",
            strict: true,
            schema: aiAnalysisJsonSchema,
          },
        },
        messages: [
          {
            role: "system",
            content:
              "You convert textile client conversation transcripts into structured business intelligence JSON, and you always write the final analysis in English.",
          },
          {
            role: "user",
            content: buildPrompt(conversation, transcript),
          },
        ],
      } as never);

      const raw = completion.choices[0]?.message?.content;

      if (!raw) {
        throw new Error("OpenRouter returned an empty analysis payload.");
      }

      return parseAiAnalysis(JSON.parse(raw));
    } catch (error) {
      lastError = error;
      if (!hasBackupRemaining || !shouldTryBackupOpenRouterKey(error)) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("OpenRouter analysis failed unexpectedly.");
}
