import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getAiEnv,
  getSupabaseStorageEnv,
  hasAiEnv,
  hasTranscriptionEnv,
  isMockProcessingEnabled,
} from "@/lib/env";
import { buildMockAnalysis, buildMockTranscript } from "@/lib/mock-analysis";
import {
  getConversationDetail,
  replaceFollowUpTasks,
  saveAnalysis,
  saveTranscript,
  setConversationStatus,
} from "@/lib/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertTranscriptUsableForAnalysis } from "@/lib/transcript-quality";
import type { ConversationSourceLanguage } from "@/lib/types";
import { transcribeAudioBuffer } from "@/lib/vendors/assemblyai";
import { analyzeConversation } from "@/lib/vendors/openrouter-analysis";

function shouldAllowMockFallback() {
  return isMockProcessingEnabled();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected provider error.";
}

export async function processConversationJob(args: {
  userId: string;
  conversationId: string;
  sourceLanguage?: ConversationSourceLanguage;
  client?: SupabaseClient;
}) {
  const supabase = args.client ?? (await createSupabaseServerClient());
  if (!supabase) {
    throw new Error("Supabase session is not available for processing.");
  }

  const detail = await getConversationDetail(
    args.userId,
    args.conversationId,
    supabase,
  );

  if (!detail || !detail.conversation.audioStoragePath) {
    return;
  }

  try {
    await setConversationStatus({
      userId: args.userId,
      conversationId: args.conversationId,
      status: "transcribing",
      failureReason: null,
      client: supabase,
    });

    let transcriptPayload: Parameters<typeof saveTranscript>[0]["transcript"];
    let analysisPayload;
    let analysisProviderModel: string | null = null;
    const allowMockFallback = shouldAllowMockFallback();

    if (!hasTranscriptionEnv()) {
      if (!allowMockFallback) {
        throw new Error(
          "AssemblyAI is not configured. Add ASSEMBLYAI_API_KEY or enable MOCK_PROCESSING=true.",
        );
      }

      transcriptPayload = buildMockTranscript(
        detail.conversation,
        args.sourceLanguage ?? "auto",
      );
    } else {
      try {
        const { data, error } = await supabase.storage
          .from(getSupabaseStorageEnv().SUPABASE_AUDIO_BUCKET)
          .download(detail.conversation.audioStoragePath);

        if (error || !data) {
          throw new Error(error?.message ?? "Unable to download the audio file.");
        }

        const buffer = await data.arrayBuffer();
        transcriptPayload = await transcribeAudioBuffer(buffer, {
          sourceLanguage: args.sourceLanguage ?? "auto",
        });
      } catch (error) {
        if (!allowMockFallback) {
          throw error;
        }

        transcriptPayload = buildMockTranscript(
          detail.conversation,
          args.sourceLanguage ?? "auto",
        );
      }
    }

    assertTranscriptUsableForAnalysis(transcriptPayload);

    await saveTranscript({
      userId: args.userId,
      conversationId: args.conversationId,
      transcript: transcriptPayload,
      client: supabase,
    });

    await setConversationStatus({
      userId: args.userId,
      conversationId: args.conversationId,
      status: "analyzing",
      failureReason: null,
      client: supabase,
    });

    if (!hasAiEnv()) {
      if (!allowMockFallback) {
        throw new Error(
          "OpenRouter is not configured. Add OPENROUTER_API_KEY or enable MOCK_PROCESSING=true.",
        );
      }

      analysisPayload = buildMockAnalysis();
      analysisProviderModel = "mock";
    }

    if (!analysisPayload) {
      const transcriptRecord = await getConversationDetail(
        args.userId,
        args.conversationId,
        supabase,
      );

      if (!transcriptRecord?.transcript) {
        throw new Error("Transcript was not stored correctly.");
      }

      try {
        analysisPayload = await analyzeConversation({
          conversation: transcriptRecord.conversation,
          transcript: transcriptRecord.transcript,
        });
        analysisProviderModel = getAiEnv().OPENROUTER_MODEL;
      } catch (error) {
        if (!allowMockFallback) {
          throw error;
        }

        analysisPayload = buildMockAnalysis();
        analysisProviderModel = `mock-fallback:${getErrorMessage(error)}`;
      }
    }

    await saveAnalysis({
      userId: args.userId,
      conversationId: args.conversationId,
      analysis: analysisPayload,
      providerModel: analysisProviderModel,
      client: supabase,
    });

    await replaceFollowUpTasks({
      userId: args.userId,
      conversationId: args.conversationId,
      analysis: analysisPayload,
      client: supabase,
    });

    await setConversationStatus({
      userId: args.userId,
      conversationId: args.conversationId,
      status: "review_required",
      failureReason: null,
      client: supabase,
    });
  } catch (error) {
    await setConversationStatus({
      userId: args.userId,
      conversationId: args.conversationId,
      status: "failed",
      failureReason:
        error instanceof Error ? error.message : "Processing failed unexpectedly.",
      client: supabase,
    });
  }
}
