import Link from "next/link";

import { getDemoCaptureTargets } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";

export default function DemoCapturePage() {
  const { featuredConversation, supportedInsights } = getDemoCaptureTargets();

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
      <section className="surface-panel reveal-rise rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-kicker">
              Capture Walkthrough
            </p>
            <h2 className="mt-2 font-serif text-3xl text-stone-900 sm:text-4xl">
              What the live app captures before analysis starts
            </h2>
          </div>
          <div className="signal-chip self-start">
            Consent-first
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["Client name", featuredConversation.conversation.clientName],
            ["Meeting title", featuredConversation.conversation.meetingTitle],
            ["Meeting date", formatDate(featuredConversation.conversation.meetingDate)],
            ["Conversation type", "Phone call / uploaded recording / in-person / video"],
            ["Primary language", "Gujarati or auto-detect, with English analysis output"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="metric-panel rounded-[1.5rem] p-4 shadow-none"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                {label}
              </p>
              <p className="mt-2 text-sm text-stone-800">{value}</p>
            </div>
          ))}
        </div>

        <div className="accent-panel mt-6 rounded-[1.75rem] border border-amber-200 p-5 shadow-none">
          <p className="text-sm font-semibold text-amber-900">Consent reminder</p>
          <p className="mt-2 text-sm leading-7 text-amber-800">
            The live app is built only for clear, visible, consent-based recording.
            It does not support hidden or background recording.
          </p>
          <p className="mt-2 text-sm leading-7 text-amber-800">
            Gujarati audio can be transcribed first, while the business review and export stay in English for your workflow.
          </p>
        </div>

        <div className="metric-panel mt-6 rounded-[1.75rem] p-5 shadow-none">
          <p className="text-sm font-semibold text-stone-900">Demo sample audio</p>
          <p className="mt-2 text-sm leading-7 text-stone-600">
            Use this prepared recording during the client demo if you want to show
            that the app supports real audio capture and upload.
          </p>
          <audio controls src="/demo-textile-sample.wav" className="mt-4 w-full" />
        </div>
      </section>

      <div className="space-y-6">
        <section className="quiet-panel reveal-rise reveal-delay-1 rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
          <p className="section-kicker">
            What the analysis detects
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {supportedInsights.map((item) => (
              <span
                key={item}
                className="signal-chip border-stone-200 bg-white/80 px-4 py-2 text-sm normal-case tracking-[0.08em] text-stone-700"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="surface-panel reveal-rise reveal-delay-2 rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
          <p className="text-sm font-semibold text-stone-900">Prepared demo conversation</p>
          <h3 className="mt-2 font-serif text-2xl text-stone-900 sm:text-3xl">
            {featuredConversation.conversation.meetingTitle}
          </h3>
          <p className="mt-2 text-sm leading-7 text-stone-600">
            Open a fully prepared review screen with transcript, business
            analysis, follow-up tasks, and export state.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/demo/conversations/${featuredConversation.conversation.id}`}
              className="primary-btn w-full sm:w-auto"
            >
              Open review screen
            </Link>
            <Link
              href="/demo/dashboard"
              className="secondary-btn w-full sm:w-auto"
            >
              Back to dashboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
