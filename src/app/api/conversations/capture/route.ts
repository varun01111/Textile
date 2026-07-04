import { after } from "next/server";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createCapturedConversation, getConversationStatus } from "@/lib/conversations";
import {
  getFeatureReadiness,
  hasSupabaseStorageEnv,
} from "@/lib/env";
import { processConversationJob } from "@/lib/processing";
import {
  createSupabaseAccessTokenClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { captureMetadataSchema, validateAudioUpload } from "@/lib/validation/conversation";

// Give after() background processing the highest practical window on Vercel Hobby.
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    if (!hasSupabaseStorageEnv()) {
      return NextResponse.json(
        {
          error:
            "Supabase is not configured yet. Add the required Supabase environment variables in .env.local first.",
        },
        { status: 400 },
      );
    }

    const requestClient = await createSupabaseServerClient();
    const user = await getCurrentUser(requestClient ?? undefined);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const {
      data: { session },
    } = await requestClient!.auth.getSession();

    if (!session?.access_token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const workerClient = createSupabaseAccessTokenClient(session.access_token);

    const readiness = getFeatureReadiness();
    if (!readiness.processingReady) {
      const missing = [
        ...readiness.checklist.transcription,
        ...readiness.checklist.ai,
      ].join(", ");

      return NextResponse.json(
        {
          error: `Conversation processing is not configured yet. Add ${missing} or set MOCK_PROCESSING=true for local demo mode.`,
        },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("audio");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    }

    validateAudioUpload({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    const metadata = captureMetadataSchema.parse({
      clientName: formData.get("clientName"),
      meetingTitle: formData.get("meetingTitle"),
      meetingDate: formData.get("meetingDate"),
      conversationType: formData.get("conversationType"),
      sourceLanguage: formData.get("sourceLanguage") ?? undefined,
      consentAcknowledged: formData.get("consentAcknowledged") === "true",
    });

    const conversationId = await createCapturedConversation({
      userId: user.id,
      file,
      metadata,
      client: requestClient ?? undefined,
    });

    after(async () => {
      await processConversationJob({
        userId: user.id,
        conversationId,
        sourceLanguage: metadata.sourceLanguage,
        client: workerClient,
      });
    });

    const status = await getConversationStatus(
      user.id,
      conversationId,
      requestClient ?? undefined,
    );
    return NextResponse.json(status, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Capture could not be started.",
      },
      { status: 400 },
    );
  }
}
