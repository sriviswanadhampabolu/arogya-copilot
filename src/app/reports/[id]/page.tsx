"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/navigation/app-shell";
import { createClient } from "@/utils/supabase/client";
import { useT } from "@/i18n/context";
import {
  FileText,
  Calendar,
  User,
  Building2,
  AlertTriangle,
  Pill,
  Activity,
  HeartPulse,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  Filter,
  CheckCircle2,
  Clock,
  Info,
  Languages,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ReportDetail {
  id: string;
  doc_type: string;
  title: string;
  report_date: string | null;
  doctor_name: string | null;
  facility: string | null;
  summary: string;
  key_points: string[];
  questions_for_doctor: string[];
  confidence: number;
  needs_review: boolean;
  file_path: string;
  language_detected: string;
  created_at: string;
  translations?: Record<string, TranslationData>;
}

interface LabValueItem {
  id: string;
  test_name: string;
  value: number;
  unit: string;
  ref_low: number | null;
  ref_high: number | null;
  ref_text: string;
  status: "normal" | "low" | "high";
  explanation: string;
  loinc_code: string | null;
  confidence: number;
}

interface MedicationItem {
  id: string;
  name: string;
  generic_name: string | null;
  strength: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  route: string | null;
  instructions: string | null;
  purpose: string | null;
  confidence: number;
}

interface ConditionItem {
  id: string;
  name: string;
  status: "active" | "resolved" | "suspected" | null;
  notes: string | null;
  confidence: number;
}

interface TranslationData {
  summary: string;
  key_points: string[];
  questions_for_doctor: string[];
  tests: Array<{ id: string; explanation: string }>;
  medicines: Array<{ id: string; instructions: string | null; purpose: string | null }>;
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { lang, t } = useT();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [labValues, setLabValues] = useState<LabValueItem[]>([]);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [conditions, setConditions] = useState<ConditionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);
  const [signedDocUrl, setSignedDocUrl] = useState<string | null>(null);
  const [loadingDocUrl, setLoadingDocUrl] = useState(false);

  // Translation State
  const [currentTranslation, setCurrentTranslation] = useState<TranslationData | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [activeLang, setActiveLang] = useState<"en" | "te" | "hi">(lang);

  const fetchTranslation = useCallback(async (targetLang: "te" | "hi") => {
    if (!id) return;
    setTranslating(true);
    try {
      const res = await fetch("/api/reports/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: id, lang: targetLang }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Translation request failed");
      }

      setCurrentTranslation(data.translation);
      setShowOriginal(false);
      setActiveLang(targetLang);
      toast.success(
        targetLang === "te"
          ? "తెలుగులోకి అనువాదం పూర్తయింది!"
          : "हिंदी में अनुवाद पूर्ण हुआ!"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Translation failed";
      toast.error(msg);
    } finally {
      setTranslating(false);
    }
  }, [id]);

  useEffect(() => {
    async function fetchReportData() {
      if (!id) return;
      try {
        const supabase = createClient();

        // 1. Fetch report
        const { data: rep, error: repError } = await supabase
          .from("reports")
          .select("*")
          .eq("id", id)
          .single();

        if (repError || !rep) {
          toast.error("Report not found or access denied.");
          router.push("/dashboard");
          return;
        }

        setReport(rep);

        // 2. Fetch related tests
        const { data: tests } = await supabase
          .from("lab_values")
          .select("*")
          .eq("report_id", id);
        if (tests) setLabValues(tests);

        // 3. Fetch related medications
        const { data: meds } = await supabase
          .from("medications")
          .select("*")
          .eq("report_id", id);
        if (meds) setMedications(meds);

        // 4. Fetch related conditions
        const { data: conds } = await supabase
          .from("conditions")
          .select("*")
          .eq("report_id", id);
        if (conds) setConditions(conds);

        // Auto-load translation if app language is te or hi
        if (lang === "te" || lang === "hi") {
          const cached = rep.translations?.[lang];
          if (cached) {
            setCurrentTranslation(cached);
            setActiveLang(lang);
          } else {
            fetchTranslation(lang);
          }
        }
      } catch (err) {
        console.error("Failed to load report data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, [id, router, lang, fetchTranslation]);

  const handleViewOriginal = async () => {
    if (!report?.file_path) return;
    if (signedDocUrl) {
      window.open(signedDocUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setLoadingDocUrl(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("reports")
        .createSignedUrl(report.file_path, 3600);

      if (error || !data?.signedUrl) {
        toast.error("Could not generate secure document preview link.");
        return;
      }

      setSignedDocUrl(data.signedUrl);
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Error opening document");
    } finally {
      setLoadingDocUrl(false);
    }
  };

  const filteredLabValues = useMemo(() => {
    if (!onlyAbnormal) return labValues;
    return labValues.filter((t) => t.status === "high" || t.status === "low");
  }, [labValues, onlyAbnormal]);

  const docTypeLabel = (type: string) => {
    switch (type) {
      case "lab_report":
        return "Lab Diagnostic Report";
      case "prescription":
        return "Doctor Prescription";
      case "discharge_summary":
        return "Discharge Summary";
      case "diagnostic_imaging":
        return "Diagnostic Imaging / Scan";
      default:
        return "Medical Document";
    }
  };

  // Determine active text content (Translated vs Original)
  const isTranslatedActive = !showOriginal && currentTranslation !== null;

  const displaySummary = isTranslatedActive
    ? currentTranslation!.summary
    : report?.summary || "";

  const displayKeyPoints = isTranslatedActive
    ? currentTranslation!.key_points
    : report?.key_points || [];

  const displayQuestions = isTranslatedActive
    ? currentTranslation!.questions_for_doctor
    : report?.questions_for_doctor || [];

  const getTestExplanation = (testId: string, originalExp: string) => {
    if (!isTranslatedActive) return originalExp;
    const match = currentTranslation!.tests?.find((t) => t.id === testId);
    return match?.explanation || originalExp;
  };

  const getMedDetails = (medId: string, origInstructions: string | null, origPurpose: string | null) => {
    if (!isTranslatedActive) return { instructions: origInstructions, purpose: origPurpose };
    const match = currentTranslation!.medicines?.find((m) => m.id === medId);
    return {
      instructions: match?.instructions || origInstructions,
      purpose: match?.purpose || origPurpose,
    };
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-40 glass rounded-2xl" />
          <div className="h-44 glass-strong rounded-3xl" />
          <div className="h-64 glass rounded-3xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-48 glass rounded-3xl" />
            <div className="h-48 glass rounded-3xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!report) return null;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Back navigation & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors glass px-3 py-1.5 rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("btn_back_dashboard")}
          </Link>

          <div className="flex items-center gap-2">
            {report.file_path && (
              <button
                type="button"
                onClick={handleViewOriginal}
                disabled={loadingDocUrl}
                className="glass-button text-xs !py-1.5 !px-3.5 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{loadingDocUrl ? "Generating link..." : t("btn_view_original")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Translation Control Bar */}
        <div className="glass px-4 sm:px-6 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-white/40 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-teal-500" />
            <span className="text-xs font-bold text-foreground">Language / అనువాదం / अनुवाद:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowOriginal(true);
                setActiveLang("en");
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                activeLang === "en" || showOriginal
                  ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                  : "glass text-foreground/75 hover:border-teal-500/30"
              }`}
            >
              English
            </button>

            <button
              type="button"
              disabled={translating}
              onClick={() => fetchTranslation("te")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border flex items-center gap-1 ${
                activeLang === "te" && !showOriginal
                  ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                  : "glass text-foreground/75 hover:border-teal-500/30"
              }`}
            >
              {translating && activeLang === "te" && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>తెలుగు</span>
            </button>

            <button
              type="button"
              disabled={translating}
              onClick={() => fetchTranslation("hi")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border flex items-center gap-1 ${
                activeLang === "hi" && !showOriginal
                  ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                  : "glass text-foreground/75 hover:border-teal-500/30"
              }`}
            >
              {translating && activeLang === "hi" && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>हिन्दी</span>
            </button>

            {currentTranslation && (
              <button
                type="button"
                onClick={() => setShowOriginal(!showOriginal)}
                className="ml-1 text-xs font-semibold px-2.5 py-1 rounded-full glass hover:border-teal-500/40 text-foreground/80 hover:text-foreground"
              >
                {showOriginal ? t("btn_translate") : t("btn_show_original")}
              </button>
            )}
          </div>
        </div>

        {/* Needs Review Amber Banner */}
        {report.needs_review && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl glass-strong border border-amber-500/40 bg-amber-500/10 flex items-start sm:items-center gap-3 text-xs sm:text-sm text-amber-800 dark:text-amber-300 shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1">
              <strong className="font-semibold block">Attention: Handwriting / Low Clarity Detected</strong>
              <span>{t("rep_hard_to_read")}</span>
            </div>
          </motion.div>
        )}

        {/* Header Glass Card */}
        <div className="glass p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
              {docTypeLabel(report.doc_type)}
            </span>

            {report.confidence && (
              <span className="text-[11px] text-foreground/60 font-medium glass px-2.5 py-0.5 rounded-full">
                AI Confidence: {(report.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {report.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-foreground/75 pt-1">
            {report.report_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-500" />
                <span>Document Date: {report.report_date}</span>
              </div>
            )}
            {report.doctor_name && (
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-500" />
                <span>Doctor: {report.doctor_name}</span>
              </div>
            )}
            {report.facility && (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-violet-500" />
                <span>Facility: {report.facility}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <div className="glass-strong p-6 sm:p-8 rounded-3xl space-y-4 shadow-md border border-white/40 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {t("rep_summary_title")}
              </h2>
            </div>

            {isTranslatedActive && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300">
                {activeLang === "te" ? "తెలుగు అనువాదం" : "हिंदी अनुवाद"}
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            {displaySummary}
          </p>

          {/* Key Points */}
          {displayKeyPoints && displayKeyPoints.length > 0 && (
            <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-2.5">
              <h3 className="text-xs uppercase tracking-wider font-bold text-foreground/60">
                {t("rep_key_findings")}
              </h3>
              <ul className="space-y-2">
                {displayKeyPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* SECTION 1: Test Results (If tests exist) */}
        {labValues.length > 0 && (
          <div className="glass p-6 sm:p-8 rounded-3xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  {t("rep_biomarkers_title")} ({labValues.length})
                </h2>
              </div>

              {/* Toggle Abnormal */}
              <button
                type="button"
                onClick={() => setOnlyAbnormal(!onlyAbnormal)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  onlyAbnormal
                    ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                    : "glass text-foreground/75 hover:border-teal-500/40"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>
                  {t("btn_show_abnormal")} ({labValues.filter((t) => t.status !== "normal").length})
                </span>
              </button>
            </div>

            {/* Test Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredLabValues.map((test) => {
                const statusBadge =
                  test.status === "high"
                    ? "badge-high"
                    : test.status === "low"
                    ? "badge-low"
                    : "badge-normal";

                const statusLabel =
                  test.status === "high"
                    ? t("status_high")
                    : test.status === "low"
                    ? t("status_low")
                    : t("status_normal");

                const explanationText = getTestExplanation(test.id, test.explanation);

                return (
                  <div
                    key={test.id}
                    className="glass-strong p-5 rounded-2xl space-y-3 border border-white/40 dark:border-white/10 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-foreground leading-snug">
                          {test.test_name}
                        </h4>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${statusBadge}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-foreground">
                          {test.value}
                        </span>
                        <span className="text-xs text-foreground/60 font-medium">
                          {test.unit}
                        </span>
                      </div>

                      {test.ref_text && (
                        <p className="text-[11px] text-foreground/60">
                          {t("rep_ref_range")}: <span className="font-medium text-foreground/80">{test.ref_text}</span>
                        </p>
                      )}
                    </div>

                    {explanationText && (
                      <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-start gap-1.5 text-xs text-foreground/70">
                        <Info className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{explanationText}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: Medications (If medications exist) */}
        {medications.length > 0 && (
          <div className="glass p-6 sm:p-8 rounded-3xl space-y-5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Pill className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {t("rep_medications_title")} ({medications.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {medications.map((med) => {
                const lowConfidence = typeof med.confidence === "number" && med.confidence < 0.6;
                const { instructions, purpose } = getMedDetails(med.id, med.instructions, med.purpose);

                return (
                  <div
                    key={med.id}
                    className={`glass-strong p-5 rounded-2xl space-y-3.5 border ${
                      lowConfidence
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-white/40 dark:border-white/10"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-bold text-foreground leading-snug">
                          {med.name}
                        </h4>
                        {lowConfidence && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                            {t("rep_please_verify")}
                          </span>
                        )}
                      </div>

                      {med.generic_name && (
                        <p className="text-xs text-foreground/60 italic">
                          Generic: {med.generic_name}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {med.strength && (
                        <div className="p-2 rounded-xl glass">
                          <span className="text-[10px] text-foreground/50 block">Strength</span>
                          <span className="font-semibold text-foreground">{med.strength}</span>
                        </div>
                      )}
                      {med.dosage && (
                        <div className="p-2 rounded-xl glass">
                          <span className="text-[10px] text-foreground/50 block">{t("rep_dose")}</span>
                          <span className="font-semibold text-foreground">{med.dosage}</span>
                        </div>
                      )}
                    </div>

                    {/* Schedule / Frequency */}
                    {med.frequency && (
                      <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-800 dark:text-teal-300 text-xs flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
                            {t("rep_schedule")}
                          </span>
                          <span className="font-semibold">{med.frequency}</span>
                        </div>
                      </div>
                    )}

                    {/* Instructions & Duration */}
                    <div className="space-y-1 text-xs text-foreground/75">
                      {med.duration && (
                        <p>
                          <strong className="text-foreground">{t("rep_duration")}:</strong> {med.duration}
                        </p>
                      )}
                      {instructions && (
                        <p>
                          <strong className="text-foreground">{t("rep_instructions")}:</strong> {instructions}
                        </p>
                      )}
                      {purpose && (
                        <p className="text-foreground/70 italic pt-1">
                          {t("rep_purpose")}: {purpose}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 3: Diagnoses / Conditions (If conditions exist) */}
        {conditions.length > 0 && (
          <div className="glass p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <HeartPulse className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {t("rep_conditions_title")} ({conditions.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {conditions.map((cond) => (
                <div
                  key={cond.id}
                  className="glass-strong p-4 rounded-2xl border border-white/30 dark:border-white/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-foreground">{cond.name}</h4>
                    {cond.status && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                        {cond.status}
                      </span>
                    )}
                  </div>
                  {cond.notes && (
                    <p className="text-xs text-foreground/70">{cond.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: Questions to ask your doctor */}
        {displayQuestions && displayQuestions.length > 0 && (
          <div className="glass-strong p-6 sm:p-8 rounded-3xl space-y-4 border border-teal-500/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {t("rep_doctor_questions_title")}
              </h2>
            </div>
            <p className="text-xs text-foreground/60">
              Take these questions to your next appointment to have an informed, collaborative conversation with your healthcare provider.
            </p>

            <div className="space-y-2.5 pt-1">
              {displayQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl glass text-xs sm:text-sm text-foreground/85 flex items-start gap-3 border border-white/30 dark:border-white/10"
                >
                  <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
