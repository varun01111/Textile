import Link from "next/link";
import { notFound } from "next/navigation";

import { LiveStatusCard } from "@/components/live-status-card";
import { ReviewEditor } from "@/components/review-editor";
import { SetupPanel } from "@/components/setup-panel";
import { StatusBadge } from "@/components/status-badge";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getConversationDetail } from "@/lib/conversations";
import { hasPublicSupabaseEnv } from "@/lib/env";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!hasPublicSupabaseEnv()) {
    return <SetupPanel />;
  }

  const user = await requireAuthenticatedUser();
  const { id } = await params;
  const detail = await getConversationDetail(user.id, id);

  if (!detail) {
    notFound();
  }

  if (detail.conversation.processingStatus === "deleted") {
    return (
      <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-8">
        <StatusBadge status="deleted" />
        <h1 className="mt-4 font-serif text-4xl text-stone-900">
          This conversation&apos;s assets were deleted
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-700">
          Audio, transcript, and analysis were removed from the app. If it had already been exported, the Google Sheets row still exists in v1.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
        >
          Back to dashboard
        </Link>
      </section>
    );
  }

  if (
    ["uploaded", "transcribing", "analyzing"].includes(
      detail.conversation.processingStatus,
    )
  ) {
    return (
      <LiveStatusCard
        conversationId={detail.conversation.id}
        initialStatus={detail.conversation.processingStatus}
        failureReason={detail.conversation.failureReason}
      />
    );
  }

  if (detail.conversation.processingStatus === "failed") {
    return (
      <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-8">
        <StatusBadge status="failed" />
        <h1 className="mt-4 font-serif text-4xl text-stone-900">
          The pipeline needs another try
        </h1>
        <p className="mt-3 max-w-2xl rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
          {detail.conversation.failureReason ?? "Processing did not complete."}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-700">
          You can delete the current assets from the review screen once analysis exists, or capture the conversation again from the main flow.
        </p>
        <Link
          href="/capture"
          className="mt-6 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
        >
          Capture another recording
        </Link>
      </section>
    );
  }

  return <ReviewEditor detail={detail} />;
}
