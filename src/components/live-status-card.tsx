"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";

import { StatusBadge } from "@/components/status-badge";

const terminalStatuses = new Set([
  "review_required",
  "approved",
  "exported",
  "failed",
  "deleted",
]);

export function LiveStatusCard({
  conversationId,
  initialStatus,
  failureReason,
}: {
  conversationId: string;
  initialStatus: string;
  failureReason?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(failureReason ?? null);

  const pollStatus = useEffectEvent(async () => {
    const response = await fetch(`/api/conversations/${conversationId}/status`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      status: string;
      failureReason: string | null;
    };

    setStatus(payload.status);
    setError(payload.failureReason);

    if (terminalStatuses.has(payload.status)) {
      router.refresh();
    }
  });

  useEffect(() => {
    if (terminalStatuses.has(status)) {
      return;
    }

    const timer = window.setInterval(() => {
      void pollStatus();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [status]);

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/85 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-900">Processing pipeline</p>
          <p className="mt-1 text-sm text-stone-600">
            The app is transcribing or analyzing this conversation in the background.
          </p>
        </div>
        <StatusBadge status={status as never} />
      </div>
      {error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : (
        <p className="mt-4 text-sm text-stone-600">
          This screen refreshes automatically when the structured summary is ready.
        </p>
      )}
      <div className="mt-5">
        <Link
          href="/capture"
          className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-stone-900"
        >
          Back to capture
        </Link>
      </div>
    </section>
  );
}
