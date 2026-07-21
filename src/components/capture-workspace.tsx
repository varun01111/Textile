"use client";

import Link from "next/link";
import { AudioLines, FileAudio, UploadCloud } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useState } from "react";

import { AudioRecorder } from "@/components/audio-recorder";
import { StatusBadge } from "@/components/status-badge";
import type { ConversationSourceLanguage } from "@/lib/types";
import { compactText } from "@/lib/utils";

type CaptureStatus = {
  conversationId: string;
  status: string;
  failureReason: string | null;
  summary: string | null;
  followUpTaskCount: number;
};

const terminalStatuses = new Set(["review_required", "approved", "exported", "failed"]);

export function CaptureWorkspace() {
  const [clientName, setClientName] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [conversationType, setConversationType] = useState("in_person");
  const [sourceLanguage, setSourceLanguage] =
    useState<ConversationSourceLanguage>("gujarati");
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<CaptureStatus | null>(null);

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const pollStatus = useEffectEvent(async () => {
    if (!job) return;

    const response = await fetch(`/api/conversations/${job.conversationId}/status`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as CaptureStatus;
    setJob(payload);
  });

  useEffect(() => {
    if (!job || terminalStatuses.has(job.status)) {
      return;
    }

    const timer = window.setInterval(() => {
      void pollStatus();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [job]);

  const audioSummary = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return `${selectedFile.name} - ${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`;
  }, [selectedFile]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setError("Add a recording or upload an audio file before continuing.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("clientName", clientName);
      formData.append("meetingTitle", meetingTitle);
      formData.append("meetingDate", meetingDate);
      formData.append("conversationType", conversationType);
      formData.append("sourceLanguage", sourceLanguage);
      formData.append("consentAcknowledged", String(consentAcknowledged));
      formData.append("audio", selectedFile);

      const response = await fetch("/api/conversations/capture", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as CaptureStatus | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Capture failed.");
      }

      setJob(payload);
      setSelectedFile(null);
      setClientName("");
      setMeetingTitle("");
      setConversationType("in_person");
      setSourceLanguage("gujarati");
      setConsentAcknowledged(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Capture failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
      <form
        onSubmit={handleSubmit}
        className="surface-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-kicker">
              Capture
            </p>
            <h2 className="mt-2 font-serif text-3xl text-stone-900 sm:text-4xl">
              Record or upload the client conversation
            </h2>
          </div>
          <div className="signal-chip self-start">
            Consent-first
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-stone-800">
            Client name
            <input
              required
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              className="field-control mt-2"
            />
          </label>
          <label className="text-sm font-medium text-stone-800">
            Meeting title
            <input
              required
              value={meetingTitle}
              onChange={(event) => setMeetingTitle(event.target.value)}
              className="field-control mt-2"
            />
          </label>
          <label className="text-sm font-medium text-stone-800">
            Meeting date
            <input
              required
              type="date"
              value={meetingDate}
              onChange={(event) => setMeetingDate(event.target.value)}
              className="field-control mt-2"
            />
          </label>
          <label className="text-sm font-medium text-stone-800">
            Conversation type
            <select
              value={conversationType}
              onChange={(event) => setConversationType(event.target.value)}
              className="field-control mt-2"
            >
              <option value="in_person">In-person</option>
              <option value="phone_call">Phone call</option>
              <option value="video_call">Video call</option>
              <option value="uploaded_recording">Uploaded recording</option>
            </select>
          </label>
          <label className="text-sm font-medium text-stone-800">
            Primary language
            <select
              value={sourceLanguage}
              onChange={(event) =>
                setSourceLanguage(event.target.value as ConversationSourceLanguage)
              }
              className="field-control mt-2"
            >
              <option value="gujarati">Gujarati</option>
              <option value="english">English</option>
              <option value="auto">Auto-detect</option>
            </select>
          </label>
        </div>

        <div className="accent-panel mt-6 rounded-[1.75rem] border border-amber-200 p-5 shadow-none">
          <p className="text-sm font-semibold text-amber-900">Consent reminder</p>
          <p className="mt-2 text-sm leading-7 text-amber-800">
            Recording must be legal and consent-based. This app does not support hidden or stealth recording.
          </p>
          <p className="mt-2 text-sm leading-7 text-amber-800">
            Gujarati conversations can be transcribed first, then the business analysis is returned in English for review and export.
          </p>
          <p className="mt-2 text-sm leading-7 text-amber-800">
            For longer phone meetings, keep the page open and the screen awake. If your phone might lock or switch apps, record in your native recorder app first and upload the file here afterward.
          </p>
          <label className="mt-4 inline-flex items-center gap-3 text-sm font-medium text-stone-800">
            <input
              type="checkbox"
              checked={consentAcknowledged}
              onChange={(event) => setConsentAcknowledged(event.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-[#b55e2d] focus:ring-[#b55e2d]"
            />
            I confirm the conversation is being recorded with clear consent.
          </label>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <AudioRecorder onRecorded={setSelectedFile} />
          <div className="surface-panel rounded-[1.75rem] p-5 sm:rounded-[2rem]">
            <div className="flex items-start gap-3">
              <div className="metric-panel rounded-2xl p-3 text-stone-700 shadow-none">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">Manual upload</p>
                <p className="mt-1 text-sm text-stone-600">
                  Use this for phone calls or any recording captured outside the browser.
                </p>
              </div>
            </div>
            <label className="quiet-panel mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-stone-300 px-4 py-8 text-center transition hover:border-stone-500">
              <FileAudio className="h-6 w-6 text-stone-500" />
              <span className="mt-3 text-sm font-medium text-stone-800">
                Upload MP3, WAV, M4A, MP4, or WebM
              </span>
              <span className="mt-1 text-xs text-stone-500">
                Phone and video call recordings can be added manually here.
              </span>
              <input
                type="file"
                accept=".mp3,.wav,.m4a,.mp4,.webm,audio/*,video/mp4"
                className="sr-only"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        {selectedFile ? (
          <div className="metric-panel mt-6 rounded-[1.75rem] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900">Selected audio</p>
                <p className="mt-1 text-sm text-stone-600">{audioSummary}</p>
              </div>
              <AudioLines className="h-5 w-5 text-stone-500" />
            </div>
            {previewUrl ? (
              <audio controls src={previewUrl} className="mt-4 w-full" />
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="error-notice mt-5">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="primary-btn mt-6 w-full sm:w-auto"
        >
          {submitting ? "Saving and starting analysis..." : "Save and process conversation"}
        </button>
      </form>

      <div className="space-y-6">
        <div className="quiet-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
          <p className="section-kicker">
            What happens next
          </p>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-stone-700">
            <li>1. The app stores the original audio securely in Supabase.</li>
            <li>2. AssemblyAI transcribes Gujarati, English, or mixed business speech in the background.</li>
            <li>3. OpenRouter turns the transcript into English textile-business insights.</li>
            <li>4. You review the structured summary before export.</li>
            <li>5. One final row is written to the master Google Sheet.</li>
          </ol>
        </div>

        {job ? (
          <div className="surface-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-900">Latest capture</p>
                <p className="mt-1 text-sm text-stone-600">
                  Conversation ID:
                  {" "}
                  <code className="break-all">{job.conversationId}</code>
                </p>
              </div>
              <StatusBadge status={job.status as never} />
            </div>
            {job.failureReason ? (
              <p className="error-notice mt-4">
                {job.failureReason}
              </p>
            ) : null}
            {job.summary ? (
              <p className="mt-4 text-sm leading-7 text-stone-700">
                {compactText(job.summary, 240)}
              </p>
            ) : job.status === "failed" ? (
              <p className="mt-4 text-sm text-stone-600">
                Processing stopped before transcript analysis could finish. If this was recorded on a phone, keep the page open and screen awake next time, or upload a file recorded in your phone recorder app.
              </p>
            ) : (
              <p className="mt-4 text-sm text-stone-600">
                The app is still preparing the transcript and analysis.
              </p>
            )}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`/conversations/${job.conversationId}`}
                className="primary-btn w-full px-4 py-2 sm:w-auto"
              >
                Open review screen
              </Link>
              <Link
                href="/dashboard"
                className="secondary-btn w-full px-4 py-2 sm:w-auto"
              >
                View dashboard
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
