"use client";

import React from "react";
import { AppShell } from "@/components/navigation/app-shell";
import {
  Activity,
  UploadCloud,
  FileText,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";

const mockLabTrends = [
  { month: "Jan", hemoglobin: 13.8, glucose: 94 },
  { month: "Mar", hemoglobin: 14.1, glucose: 98 },
  { month: "May", hemoglobin: 14.0, glucose: 92 },
  { month: "Jul", hemoglobin: 14.2, glucose: 96 },
  { month: "Sep", hemoglobin: 14.4, glucose: 91 },
];

export default function DashboardPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const tealColor = isDark ? "#14b8a6" : "#0d9488";
  const skyColor = isDark ? "#38bdf8" : "#0284c7";
  const textColor = isDark ? "#94a3b8" : "#64748b";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="glass p-6 sm:p-8 rounded-3xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Health Intelligence Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome to your Health Copilot
            </h1>
            <p className="text-sm sm:text-base text-foreground/70 max-w-xl">
              Track biomarkers, review organized lab reports, and discuss health trends securely with your AI companion.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/upload" className="glass-button text-xs sm:text-sm !py-2.5 !px-5">
                <UploadCloud className="w-4 h-4" />
                Upload New Report
              </Link>
              <Link href="/chat" className="glass-button-secondary text-xs sm:text-sm !py-2.5 !px-5">
                <Activity className="w-4 h-4 text-teal-500" />
                Ask Copilot
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Biomarkers Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass p-5 rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/60 font-medium">Hemoglobin (Hb)</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full badge-normal">
                Normal
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">14.4 g/dL</div>
            <p className="text-[11px] text-foreground/60">Reference: 13.5 - 17.5 g/dL</p>
          </div>

          <div className="glass p-5 rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/60 font-medium">Fasting Blood Sugar</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full badge-normal">
                Normal
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">91 mg/dL</div>
            <p className="text-[11px] text-foreground/60">Reference: 70 - 99 mg/dL</p>
          </div>

          <div className="glass p-5 rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/60 font-medium">Serum Vitamin D</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full badge-low">
                Low
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">22.4 ng/mL</div>
            <p className="text-[11px] text-foreground/60">Optimal: 30 - 100 ng/mL</p>
          </div>
        </div>

        {/* Biomarker Trend Chart */}
        <div className="glass-strong p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-foreground">Longitudinal Health Trends</h2>
              <p className="text-xs text-foreground/60">
                Visualizing historical lab values over past recorded panels
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-500" />
                <span>Hemoglobin</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-500" />
                <span>Glucose</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockLabTrends}>
                <defs>
                  <linearGradient id="colorHb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={tealColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={tealColor} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorGl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={skyColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={skyColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke={textColor} fontSize={12} tickLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "16px",
                    border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.1)",
                    color: isDark ? "#f8fafc" : "#0f172a",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hemoglobin"
                  stroke={tealColor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorHb)"
                />
                <Area
                  type="monotone"
                  dataKey="glucose"
                  stroke={skyColor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorGl)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Reports Empty/Sample State */}
        <div className="glass p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Recent Diagnostics</h2>
            <Link
              href="/upload"
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              Upload report <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-strong p-8 rounded-2xl text-center space-y-3 border border-dashed border-white/40 dark:border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No reports uploaded yet</h3>
            <p className="text-xs text-foreground/60 max-w-sm mx-auto">
              Upload blood tests, complete metabolic panels, or pathology reports to view automated biomarker summaries and AI breakdowns.
            </p>
            <div className="pt-2">
              <Link href="/upload" className="glass-button text-xs !py-2 !px-4">
                <UploadCloud className="w-3.5 h-3.5" />
                Upload Your First Report
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
