import type { ReactNode } from "react";

import { DemoWorkspaceBanner } from "@/components/demo-workspace-banner";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-8">
      <DemoWorkspaceBanner />
      {children}
    </div>
  );
}
