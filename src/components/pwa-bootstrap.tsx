"use client";

import { useEffect } from "react";

const devServiceWorkerResetKey = "textile-dev-sw-reset";
const cacheNamePrefix = "textile-client-intelligence";

export function PwaBootstrap() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    async function syncServiceWorker() {
      if (process.env.NODE_ENV !== "production") {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const hadRegistrations = registrations.length > 0;

        await Promise.all(
          registrations.map((registration) => registration.unregister()),
        );

        if ("caches" in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(
            cacheKeys
              .filter((key) => key.startsWith(cacheNamePrefix))
              .map((key) => caches.delete(key)),
          );
        }

        if (
          hadRegistrations &&
          !window.sessionStorage.getItem(devServiceWorkerResetKey)
        ) {
          window.sessionStorage.setItem(devServiceWorkerResetKey, "true");
          window.location.reload();
          return;
        }

        window.sessionStorage.removeItem(devServiceWorkerResetKey);
        return;
      }

      await navigator.serviceWorker.register("/sw.js");
    }

    void syncServiceWorker().catch(() => {});
  }, []);

  return null;
}
