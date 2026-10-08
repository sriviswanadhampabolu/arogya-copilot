"use client";

import React from "react";
import { TopBar } from "./top-bar";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { HealthcareDisclaimer } from "@/components/disclaimer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-12 flex">
        <Sidebar />

        <main className="flex-1 md:pl-72 w-full transition-all">
          <div className="max-w-4xl mx-auto space-y-6">
            <HealthcareDisclaimer />
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
