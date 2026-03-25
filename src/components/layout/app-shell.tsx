"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { OnboardingDialog } from "@/components/shared/onboarding-dialog";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-60">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
      <CommandPalette />
      <OnboardingDialog />
    </div>
  );
}
