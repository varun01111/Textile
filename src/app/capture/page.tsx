import { CaptureWorkspace } from "@/components/capture-workspace";
import { IntegrationReadinessPanel } from "@/components/integration-readiness-panel";
import { SetupPanel } from "@/components/setup-panel";
import { requireAuthenticatedUser } from "@/lib/auth";
import { hasPublicSupabaseEnv } from "@/lib/env";

export default async function CapturePage() {
  if (!hasPublicSupabaseEnv()) {
    return <SetupPanel />;
  }

  await requireAuthenticatedUser();
  return (
    <div className="space-y-6">
      <section className="hero-panel rounded-[2.5rem] p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="section-kicker">Capture Studio</p>
            <h1 className="mt-3 max-w-4xl font-serif text-5xl text-stone-900">
              Start with the real conversation, then shape it into client-ready intelligence
            </h1>
            <p className="section-subcopy mt-3 max-w-3xl text-sm">
              This flow is built for quick textile meetings: confirm consent,
              record or upload, then move straight into structured review rather
              than letting insight disappear into raw audio files.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <span className="signal-chip">Visible recording</span>
            <span className="signal-chip">Upload any call</span>
            <span className="signal-chip">Review before export</span>
          </div>
        </div>
      </section>
      <IntegrationReadinessPanel />
      <CaptureWorkspace />
    </div>
  );
}
