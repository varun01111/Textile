import Link from "next/link";

export function DemoWorkspaceBanner() {
  const links = [
    { href: "/demo/dashboard", label: "Dashboard" },
    { href: "/demo/follow-ups", label: "Follow-ups" },
    { href: "/demo/capture", label: "Capture" },
    { href: "/demo/trends", label: "Trends" },
  ] as const;

  return (
    <section className="hero-panel reveal-rise rounded-[1.75rem] border-[#d6b38d] p-5 sm:rounded-[2rem] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">
            Client Demo Workspace
          </p>
          <h1 className="mt-2 font-serif text-3xl text-stone-900 sm:text-4xl">
            A polished sample walkthrough you can show without live API risk
          </h1>
          <p className="section-subcopy mt-3 max-w-3xl text-sm">
            This public demo mirrors the real product screens with textile-focused
            sample data, so your client can review the workflow even if login
            email, OpenRouter billing, or transcription providers are not ready live.
          </p>
        </div>
        <Link
          href="/login"
          className="secondary-btn w-full sm:w-auto"
        >
          Open live app login
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="signal-chip"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
