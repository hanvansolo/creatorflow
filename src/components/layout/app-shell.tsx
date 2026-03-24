"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-64">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
