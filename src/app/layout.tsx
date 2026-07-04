import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { PwaBootstrap } from "@/components/pwa-bootstrap";
import { SignOutButton } from "@/components/sign-out-button";
import { SiteNav } from "@/components/site-nav";
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
          <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-8 sm:py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full items-start justify-between gap-3 sm:items-center lg:w-auto">
                <div className="brand-lockup min-w-0">
                  <span className="brand-crest" aria-hidden />
                  <div className="min-w-0">
                    <Link
                      href="/"
                      className="block font-serif text-xl tracking-[0.02em] text-stone-900 sm:text-2xl"
                    >
                      Textile Intelligence
                    </Link>
                    <p className="mt-1 max-w-[15rem] text-[10px] uppercase tracking-[0.18em] text-stone-500 sm:max-w-none sm:text-[11px] sm:tracking-[0.22em]">
                      Consent-based conversation memory for textile growth
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  {user ? (
                    <>
                      <span className="signal-chip hidden max-w-[18rem] truncate lg:inline-flex">
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
              <div className="w-full lg:max-w-[38rem]">
                <SiteNav />
              </div>
            </div>
          </div>
        </header>
        <main className="page-stage mx-auto flex min-h-[calc(100vh-132px)] w-full max-w-7xl flex-col px-4 sm:min-h-[calc(100vh-88px)] sm:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
