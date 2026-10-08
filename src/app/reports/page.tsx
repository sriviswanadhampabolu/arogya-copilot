"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { createClient } from "@/utils/supabase/client";
import {
  FileText,
  UploadCloud,
  Sparkles,
  Calendar,
  ChevronRight,
  FlaskConical,
  Pill,
  Building2,
  ScanLine,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useT } from "@/i18n/context";

interface ReportItem {
  id: string;
  doc_type: string;
  title: string;
  report_date: string | null;
  doctor_name: string | null;
  facility: string | null;
  source?: string | null;
  created_at: string;
}

export default function ReportsPage() {
  const { t } = useT();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from("reports")
            .select("id, doc_type, title, report_date, doctor_name, facility, source, created_at")
            .eq("user_id", user.id)
            .order("report_date", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

          if (data) setReports(data);
        }
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case "lab_report":
        return { icon: FlaskConical, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Lab Report" };
      case "prescription":
        return { icon: Pill, color: "text-sky-500", bg: "bg-sky-500/10", label: "Prescription" };
      case "discharge_summary":
        return { icon: Building2, color: "text-violet-500", bg: "bg-violet-500/10", label: "Discharge Summary" };
      case "diagnostic_imaging":
        return { icon: ScanLine, color: "text-amber-500", bg: "bg-amber-500/10", label: "Imaging" };
      default:
        return { icon: FileText, color: "text-teal-500", bg: "bg-teal-500/10", label: "Document" };
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="glass p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Health Records Archive</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              My Health Documents
            </h1>
            <p className="text-xs sm:text-sm text-foreground/70 max-w-xl">
              Access past blood tests, doctor prescriptions, discharge summaries, and extracted biomarker summaries in one unified repository.
            </p>
          </div>

          <Link href="/upload" className="glass-button text-xs sm:text-sm !py-2.5 !px-5 self-start sm:self-auto flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>{t("btn_upload_new")}</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="glass-strong p-8 sm:p-12 rounded-3xl text-center space-y-4 border border-dashed border-white/40 dark:border-white/10 shadow-sm">
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
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const { icon: DocIcon, color, bg, label } = getDocTypeIcon(report.doc_type);

              return (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="group block p-4 sm:p-5 rounded-2xl glass-strong border border-white/40 dark:border-white/10 hover:border-teal-500/50 hover:-translate-y-0.5 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl ${bg} ${color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                        <DocIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-foreground/75">
                            {label}
                          </span>
                          {report.source === "fhir_import" && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                              FHIR import
                            </span>
                          )}
                          {report.source === "abha_import" && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                              ABHA import
                            </span>
                          )}
                          {report.report_date && (
                            <span className="text-xs text-foreground/50 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {report.report_date}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                          {report.title}
                        </h3>
                        {(report.doctor_name || report.facility) && (
                          <p className="text-xs text-foreground/60 truncate">
                            {[report.doctor_name, report.facility].filter(Boolean).join(" • ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
