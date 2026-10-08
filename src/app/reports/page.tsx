"use client";

import React from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { FileText, UploadCloud, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="glass p-6 sm:p-8 rounded-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Health Records Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Diagnostic Reports
          </h1>
          <p className="text-sm text-foreground/70 max-w-xl">
            Access past blood tests, pathology notes, and extracted biomarker summaries in one unified repository.
          </p>
        </div>

        <div className="glass-strong p-8 rounded-3xl text-center space-y-4 border border-dashed border-white/40 dark:border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No reports archived yet</h3>
            <p className="text-xs text-foreground/60 max-w-sm mx-auto">
              Once you upload PDF or image reports, they will be indexed and presented with key abnormal flags and AI summaries.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/upload" className="glass-button text-xs !py-2.5 !px-5">
              <UploadCloud className="w-4 h-4" />
              Upload Diagnostic File
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
