import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { PwaBootstrap } from "@/components/pwa-bootstrap";
import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const headingFont = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Textile Client Conversation Intelligence",
    template: "%s | Textile Client Conversation Intelligence",
  },
  description:
    "Record textile client conversations, transcribe them, extract business intelligence, and export the approved insights to Google Sheets.",
  applicationName: "Textile Client Conversation Intelligence",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Textile Intelligence",
    statusBarStyle: "default",
  },
};

const devBrowserResetScript = `
  (function () {
    if (window.location.hostname === "localhost") {
      const targetUrl = new URL(window.location.href);
      targetUrl.hostname = "127.0.0.1";
      window.location.replace(targetUrl.toString());
      return;
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        registrations.forEach(function (registration) {
          void registration.unregister();
        });
      }).catch(function () {});
    }

    if ("caches" in window) {
      caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (key) {
          return key.indexOf("textile-client-intelligence") === 0;
        }).map(function (key) {
          return caches.delete(key);
        }));
      }).catch(function () {});
    }
  })();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {process.env.NODE_ENV !== "production" ? (
          <Script id="dev-browser-reset" strategy="beforeInteractive">
            {devBrowserResetScript}
          </Script>
        ) : null}
        <PwaBootstrap />
        <div className="grain-overlay" />
        <header className="site-header">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
            <div className="brand-lockup">
              <span className="brand-crest" aria-hidden />
              <div>
                <Link href="/" className="font-serif text-2xl tracking-[0.02em] text-stone-900">
                  Textile Intelligence
                </Link>
                <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                  Consent-based conversation memory for textile growth
                </p>
              </div>
            </div>
            <nav className="nav-shell hidden items-center gap-1 rounded-full p-1 text-sm font-medium md:flex">
              <Link href="/dashboard" className="nav-link-pill">
                Dashboard
              </Link>
              <Link href="/follow-ups" className="nav-link-pill">
                Follow-ups
              </Link>
              <Link href="/capture" className="nav-link-pill">
                Capture
              </Link>
              <Link href="/trends" className="nav-link-pill">
                Trends
              </Link>
              <Link href="/demo/dashboard" className="nav-link-pill">
                Demo
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="signal-chip hidden lg:inline-flex">
                    {user.email}
                  </span>
                  <SignOutButton />
                </>
              ) : (
                <Link
                  href="/login"
                  className="primary-btn px-4 py-2 text-xs uppercase tracking-[0.18em]"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="page-stage mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl flex-col px-5 sm:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
