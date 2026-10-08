"use client";

import React from "react";
import { AppShell } from "@/components/navigation/app-shell";
import {
  Database,
  Cpu,
  Shield,
  Palette,
  Sparkles,
  Workflow,
} from "lucide-react";

const architecturePillars = [
  {
    title: "Liquid Glass Design System",
    icon: Palette,
    accent: "from-teal-500 to-emerald-400",
    description:
      "A fluid, responsive interface adhering to WCAG AA contrast standards. Features light and dark modes, CSS variable glass surfaces, three animated drifting gradient orbs, and accessibility fallbacks for reduced-motion and reduced-transparency.",
    items: [
      "Custom CSS variables for glass opacity & specular highlights",
      "Adaptive Recharts colors keyed to resolved theme",
      "Responsive 375px+ mobile glass bottom bar & desktop floating sidebar",
    ],
  },
  {
    title: "Secure Data & Authentication",
    icon: Database,
    accent: "from-sky-500 to-cyan-400",
    description:
      "Powered by Supabase Auth and PostgreSQL with user-isolated Row Level Security (RLS) policies. Medical reports are securely stored in the private reports storage bucket.",
    items: [
      "Profiles table linked 1:1 with auth.users",
      "SSR cookie session management with Next.js 14 Middleware",
      "Reports, lab_values, chat_messages, medications, conditions tables",
    ],
  },
  {
    title: "Clinical AI Processing Engine",
    icon: Cpu,
    accent: "from-violet-500 to-indigo-400",
    description:
      "Google Gemini 2.5 / 2.0 Flash models via @google/genai SDK for multimodal report ingestion, biomarker extraction, and health literacy chat translation.",
    items: [
      "Multimodal document extraction (PDF, PNG, JPG)",
      "Strict clinical guardrails: zero diagnostic claims, prominent disclaimers",
      "Doctor question preparation and longitudinal trend analysis",
    ],
  },
  {
    title: "Production Infrastructure",
    icon: Workflow,
    accent: "from-amber-500 to-orange-400",
    description:
      "Engineered on Next.js 14 App Router, TypeScript, and Tailwind CSS. Deploys seamlessly to Vercel with zero secret leakage in client bundles.",
    items: [
      "Next.js App Router with Server & Client components separation",
      "Strict environment variable separation (.env.local)",
      "Automated linting & build verification",
    ],
  },
];

export default function ArchitecturePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="glass p-6 sm:p-8 rounded-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Technical Specification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            System Architecture
          </h1>
          <p className="text-sm text-foreground/70 max-w-xl">
            A comprehensive overview of Arogya Copilot&apos;s design system, security boundaries, and AI pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {architecturePillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="glass-strong p-6 sm:p-7 rounded-3xl space-y-4 shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${pillar.accent} flex items-center justify-center text-white shadow-md`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground tracking-tight">
                      {pillar.title}
                    </h2>
                  </div>

                  <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Core Technical Pillars
                  </p>
                  <ul className="space-y-1.5">
                    {pillar.items.map((item) => (
                      <li
                        key={item}
                        className="text-xs text-foreground/70 flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Compliance Banner */}
        <div className="glass p-6 rounded-3xl flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-xs sm:text-sm">
            <h3 className="font-bold text-foreground">Healthcare Safety Guardrails</h3>
            <p className="text-foreground/70 leading-relaxed">
              Arogya Copilot is strictly an AI health literacy and organizational assistant. It adheres to ethical AI medical boundaries by displaying mandatory clinical disclaimers and refusing diagnostic or prescriptive instructions.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
