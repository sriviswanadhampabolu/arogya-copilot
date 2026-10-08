"use client";

import React from "react";
import { AppShell } from "@/components/navigation/app-shell";
import {
  Smartphone,
  UploadCloud,
  Lock,
  Cpu,
  Database,
  FileCode,
  Layers,
  Activity,
  Languages,
  MessageSquare,
  AlertTriangle,
  FileCheck2,
  Sparkles,
  ArrowDown,
  Shield,
} from "lucide-react";

export default function ArchitecturePage() {
  return (
    <AppShell>
      <div className="space-y-10">
        {/* Page Hero */}
        <div className="glass p-6 sm:p-8 rounded-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>End-to-End System Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            System Architecture
          </h1>
          <p className="text-sm sm:text-base text-foreground/70 max-w-2xl leading-relaxed">
            Arogya Copilot transforms unstructured medical documents into structured, privacy-isolated, and ABDM-ready FHIR R4 clinical records using multimodal AI.
          </p>
        </div>

        {/* SECTION 1: Connected Pipeline Diagram (CSS + Inline SVG) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Document Processing &amp; Intelligence Pipeline
              </h2>
              <p className="text-xs text-foreground/60">
                Connected data flow from client ingestion to multi-modal clinical intelligence
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full glass border border-teal-500/30 text-teal-700 dark:text-teal-300 hidden sm:inline-block">
              7 Sequential Stages
            </span>
          </div>

          <div className="space-y-3">
            {/* Step 1: User (web/mobile) */}
            <div className="glass-strong p-5 sm:p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-md hover:border-teal-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                        Stage 01
                      </span>
                      <span className="text-xs text-foreground/40">•</span>
                      <h3 className="text-base font-bold text-foreground">
                        User (Web &amp; Mobile Client)
                      </h3>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed max-w-2xl">
                      Patient uploads prescriptions, lab reports, discharge summaries, or diagnostic scans via drag-and-drop or direct mobile camera capture. Supports PDF, JPG, and PNG (up to 10MB per file).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 self-start sm:self-center pl-16 sm:pl-0">
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full glass text-foreground/75">
                    Camera &amp; Files
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full glass text-foreground/75">
                    Batch Upload
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow Connector 1 -> 2 */}
            <div className="flex justify-center py-1">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-gradient-to-b from-teal-500 to-sky-500" />
                <ArrowDown className="w-4 h-4 text-sky-500 animate-bounce" />
              </div>
            </div>

            {/* Step 2: Upload (Next.js) */}
            <div className="glass-strong p-5 sm:p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-md hover:border-sky-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                        Stage 02
                      </span>
                      <span className="text-xs text-foreground/40">•</span>
                      <h3 className="text-base font-bold text-foreground">
                        Upload Ingestion (Next.js 14 Server Runtime)
                      </h3>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed max-w-2xl">
                      Next.js route handler enforces file validation, user session authentication via Supabase SSR cookies, and rate-limiting safeguards before processing.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 self-start sm:self-center pl-16 sm:pl-0">
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full glass text-foreground/75">
                    SSR Auth Context
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full glass text-foreground/75">
                    MIME Validator
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow Connector 2 -> 3 */}
            <div className="flex justify-center py-1">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-gradient-to-b from-sky-500 to-indigo-500" />
                <ArrowDown className="w-4 h-4 text-indigo-500 animate-bounce" />
              </div>
            </div>

            {/* Step 3: Supabase Storage */}
            <div className="glass-strong p-5 sm:p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-md hover:border-indigo-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Stage 03
                      </span>
                      <span className="text-xs text-foreground/40">•</span>
                      <h3 className="text-base font-bold text-foreground">
                        Supabase Storage (Private Encrypted Bucket)
                      </h3>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed max-w-2xl">
                      Uploaded files are committed into the isolated private bucket at <code className="text-indigo-600 dark:text-indigo-400">&#123;user_id&#125;/&#123;timestamp&#125;-&#123;filename&#125;</code>. Files are never publicly exposed and can only be rendered via short-lived signed URLs.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 self-start sm:self-center pl-16 sm:pl-0">
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full glass text-foreground/75">
                    User-Isolated Paths
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full glass text-foreground/75">
                    Signed URLs (1 hr TTL)
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow Connector 3 -> 4 */}
            <div className="flex justify-center py-1">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-gradient-to-b from-indigo-500 to-violet-500" />
                <ArrowDown className="w-4 h-4 text-violet-500 animate-bounce" />
              </div>
            </div>

            {/* Step 4: Gemini AI Engine */}
            <div className="glass-strong p-5 sm:p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-md hover:border-violet-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                        Stage 04
                      </span>
                      <span className="text-xs text-foreground/40">•</span>
                      <h3 className="text-base font-bold text-foreground">
                        Gemini AI Multimodal Intelligence Engine
                      </h3>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed max-w-2xl">
                      Automated classification (lab, prescription, discharge, scan), multilingual OCR for printed &amp; handwritten text in English, Telugu, and Hindi. Extracts structured medicines, dosages, test values with reference ranges, diagnoses, dates, and per-entity confidence scores. Automatically triggers stronger model retry if confidence is low.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 self-start sm:self-center pl-16 sm:pl-0">
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                    Handwritten OCR
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                    Stronger-Model Retry
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow Connector 4 -> 5 */}
            <div className="flex justify-center py-1">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-gradient-to-b from-violet-500 to-amber-500" />
                <ArrowDown className="w-4 h-4 text-amber-500 animate-bounce" />
              </div>
            </div>

            {/* Step 5: Structured Postgres Tables */}
            <div className="glass-strong p-5 sm:p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-md hover:border-amber-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                    <Database className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        Stage 05
                      </span>
                      <span className="text-xs text-foreground/40">•</span>
                      <h3 className="text-base font-bold text-foreground">
                        Structured PostgreSQL Tables (RLS Protected)
                      </h3>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed max-w-2xl">
                      Relational persistence across <code className="text-amber-600 dark:text-amber-400">reports</code>, <code className="text-amber-600 dark:text-amber-400">lab_values</code>, <code className="text-amber-600 dark:text-amber-400">medications</code>, and <code className="text-amber-600 dark:text-amber-400">conditions</code>. Postgres Row Level Security (RLS) ensures every query strictly isolates each patient&apos;s records.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 self-start sm:self-center pl-16 sm:pl-0">
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full glass text-foreground/75">
                    RLS Enforced
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full glass text-foreground/75">
                    Biomarker History
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow Connector 5 -> 6 */}
            <div className="flex justify-center py-1">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-gradient-to-b from-amber-500 to-emerald-500" />
                <ArrowDown className="w-4 h-4 text-emerald-500 animate-bounce" />
              </div>
            </div>

            {/* Step 6: FHIR R4 Bundle Builder */}
            <div className="glass-strong p-5 sm:p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-md hover:border-emerald-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                    <FileCode className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Stage 06
                      </span>
                      <span className="text-xs text-foreground/40">•</span>
                      <h3 className="text-base font-bold text-foreground">
                        FHIR R4 Bundle Builder &amp; ABHA Sandbox Link
                      </h3>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed max-w-2xl">
                      Builds NRCeS / ABDM profile-compliant FHIR R4 bundles (type &ldquo;collection&rdquo;) with Patient, Practitioner, Observation, MedicationRequest, Condition, and Composition resources. Powers mock ABHA account linking and sample bundle imports.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 self-start sm:self-center pl-16 sm:pl-0">
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    NRCeS Profiles
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    ABHA Mock Sandbox
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow Connector 6 -> 7 (Split / Triple Connector) */}
            <div className="flex justify-center py-2">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-5 bg-gradient-to-b from-emerald-500 to-teal-500" />
                <div className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-bold px-3 py-1 rounded-full glass border border-teal-500/30">
                  <span>Outputs &amp; Patient Interfaces</span>
                  <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                </div>
              </div>
            </div>

            {/* Step 7: Outputs (Three Cards Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Output 1: Unified Timeline & Trends */}
              <div className="glass-strong p-5 rounded-3xl border border-white/40 dark:border-white/10 shadow-md space-y-3 flex flex-col justify-between hover:border-teal-500/40 transition-all">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Unified Timeline &amp; Trends
                  </h4>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    Longitudinal tracking of blood biomarkers with interactive charts, shaded reference range zones, and chronological document grouping by month.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                  /dashboard →
                </span>
              </div>

              {/* Output 2: Plain-language Summaries */}
              <div className="glass-strong p-5 rounded-3xl border border-white/40 dark:border-white/10 shadow-md space-y-3 flex flex-col justify-between hover:border-sky-500/40 transition-all">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    <Languages className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Plain-Language Summaries
                  </h4>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    Accessible explanations of medical terminology, purpose of medicines, test results, and prepared questions for doctors in English, Telugu, and Hindi.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                  /reports/[id] →
                </span>
              </div>

              {/* Output 3: Copilot Chat */}
              <div className="glass-strong p-5 rounded-3xl border border-white/40 dark:border-white/10 shadow-md space-y-3 flex flex-col justify-between hover:border-violet-500/40 transition-all">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Grounded Health Copilot Chat
                  </h4>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    Conversational AI streaming responses grounded strictly in the patient&apos;s own lab history, prescriptions, and documented conditions. Zero hallucination.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                  /chat →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Four Architectural Pillar Glass Cards */}
        <div className="space-y-4 pt-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Architecture &amp; Safety Pillars
            </h2>
            <p className="text-xs text-foreground/60">
              Core structural standards governing Arogya Copilot&apos;s design and deployment
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Data model */}
            <div className="glass p-5 rounded-3xl space-y-3 border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Data Model</h3>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  Relational schema connecting <code className="text-teal-600 dark:text-teal-400 font-mono text-[11px]">auth.users</code> to profiles, reports, lab values, medications, and conditions with JSONB storage for FHIR bundles and multilingual translations.
                </p>
              </div>
              <ul className="text-[11px] text-foreground/60 space-y-1 pt-1 border-t border-white/20 dark:border-white/10">
                <li>• 1:1 profiles mapping</li>
                <li>• 1:N normalized lab values</li>
                <li>• Indexed document timestamps</li>
              </ul>
            </div>

            {/* Card 2: Privacy and security */}
            <div className="glass p-5 rounded-3xl space-y-3 border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Privacy &amp; Security</h3>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  Medical files stored in private Supabase storage buckets. Database-enforced Row Level Security (RLS) ensures total tenant isolation. Documents are served exclusively via time-limited signed URLs.
                </p>
              </div>
              <ul className="text-[11px] text-foreground/60 space-y-1 pt-1 border-t border-white/20 dark:border-white/10">
                <li>• Private storage buckets</li>
                <li>• Per-user RLS policies</li>
                <li>• Signed URLs (3600s TTL)</li>
              </ul>
            </div>

            {/* Card 3: Healthcare safety */}
            <div className="glass p-5 rounded-3xl space-y-3 border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Healthcare Safety</h3>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  Strict non-diagnostic boundaries: Arogya never diagnoses or prescribes. Persistent clinical disclaimers, doctor visit question guides, and &ldquo;Please verify&rdquo; badges on low-confidence extractions.
                </p>
              </div>
              <ul className="text-[11px] text-foreground/60 space-y-1 pt-1 border-t border-white/20 dark:border-white/10">
                <li>• Prominent disclaimers</li>
                <li>• Zero prescriptive claims</li>
                <li>• Low-confidence flags</li>
              </ul>
            </div>

            {/* Card 4: ABDM readiness */}
            <div className="glass p-5 rounded-3xl space-y-3 border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">ABDM Readiness</h3>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  Adheres to Indian National Resource Centre for EHR Standards (NRCeS) FHIR R4 profiles. Features simulated ABHA linking, sandbox bundle importing, and one-click full health record JSON export.
                </p>
              </div>
              <ul className="text-[11px] text-foreground/60 space-y-1 pt-1 border-t border-white/20 dark:border-white/10">
                <li>• FHIR R4 collection bundles</li>
                <li>• Mock ABHA 14-digit linking</li>
                <li>• Full record JSON export</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
