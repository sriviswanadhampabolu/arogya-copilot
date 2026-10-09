"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/navigation/app-shell";
import { createClient } from "@/utils/supabase/client";
import { useTheme } from "next-themes";
import { useT } from "@/i18n/context";
import {
  FileText,
  UploadCloud,
  FlaskConical,
  Pill,
  Building2,
  ScanLine,
  Activity,
  AlertTriangle,
  HeartPulse,
  Clock,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  User,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
} from "recharts";

interface Profile {
  full_name: string | null;
  age: number | null;
  gender: string | null;
  abha_number?: string | null;
  abha_address?: string | null;
  abha_linked?: boolean | null;
}

interface Report {
  id: string;
  doc_type: string;
  title: string;
  report_date: string | null;
  doctor_name: string | null;
  facility: string | null;
  source?: string | null;
  created_at: string;
}

interface LabValue {
  id: string;
  report_id: string;
  test_name: string;
  value: number;
  unit: string;
  ref_low: number | null;
  ref_high: number | null;
  ref_text: string | null;
  status: "normal" | "low" | "high";
  report_date: string | null;
}

interface Medication {
  id: string;
  report_id: string;
  name: string;
  generic_name: string | null;
  strength: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  prescribed_date: string | null;
}

interface Condition {
  id: string;
  report_id: string;
  name: string;
  status: string | null;
  notes: string | null;
}

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    let start = 0;
    const end = value;
    const duration = 600;
    const steps = 25;
    const stepTime = duration / steps;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(Math.ceil(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{display}</span>;
}

export default function DashboardPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { t } = useT();

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [labValues, setLabValues] = useState<LabValue[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);

  // Timeline Filter: all | lab_report | prescription | discharge_summary | diagnostic_imaging
  const [timelineFilter, setTimelineFilter] = useState<string>("all");

  // Selected test for Trends chart
  const [selectedTest, setSelectedTest] = useState<string>("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch profile
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, age, gender, abha_number, abha_address, abha_linked")
          .eq("id", user.id)
          .single();
        if (prof) setProfile(prof);

        // Fetch reports (ordered newest first)
        const { data: reps } = await supabase
          .from("reports")
          .select("id, doc_type, title, report_date, doctor_name, facility, source, created_at")
          .order("report_date", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
        if (reps) setReports(reps);

        // Fetch lab values
        const { data: labs } = await supabase
          .from("lab_values")
          .select("id, report_id, test_name, value, unit, ref_low, ref_high, ref_text, status, report_date");
        if (labs) setLabValues(labs);

        // Fetch medications
        const { data: meds } = await supabase
          .from("medications")
          .select("id, report_id, name, generic_name, strength, dosage, frequency, duration, prescribed_date");
        if (meds) setMedications(meds);

        // Fetch conditions
        const { data: conds } = await supabase
          .from("conditions")
          .select("id, report_id, name, status, notes");
        if (conds) setConditions(conds);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Distinct tests list & default to most frequent test
  const testNames = useMemo(() => {
    const counts: Record<string, number> = {};
    labValues.forEach((l) => {
      if (l.test_name) {
        counts[l.test_name] = (counts[l.test_name] || 0) + 1;
      }
    });

    const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return sorted;
  }, [labValues]);

  useEffect(() => {
    if (testNames.length > 0 && !selectedTest) {
      setSelectedTest(testNames[0]);
    }
  }, [testNames, selectedTest]);

  // Stat 1: Total documents
  const totalDocuments = reports.length;

  // Stat 2: Active medicines
  const activeMedicinesCount = medications.length;

  // Stat 3: Abnormal values in the latest lab report
  const latestLabReportAbnormals = useMemo(() => {
    const latestLabRep = reports.find((r) => r.doc_type === "lab_report");
    if (!latestLabRep) return 0;
    return labValues.filter(
      (l) => l.report_id === latestLabRep.id && l.status !== "normal"
    ).length;
  }, [reports, labValues]);

  // Filtered timeline reports
  const filteredReports = useMemo(() => {
    if (timelineFilter === "all") return reports;
    return reports.filter((r) => r.doc_type === timelineFilter);
  }, [reports, timelineFilter]);

  // Group timeline by month: "October 2026", "September 2026", etc.
  const groupedTimeline = useMemo(() => {
    const groups: { [key: string]: Report[] } = {};

    filteredReports.forEach((rep) => {
      const dateStr = rep.report_date || rep.created_at;
      let monthLabel = "Earlier Records";
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          monthLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        }
      }
      if (!groups[monthLabel]) groups[monthLabel] = [];
      groups[monthLabel].push(rep);
    });

    return groups;
  }, [filteredReports]);

  // Helper map for badges per report
  const reportBadges = useMemo(() => {
    const badges: Record<string, { medCount: number; abnormalCount: number; totalTests: number }> = {};
    reports.forEach((r) => {
      const medCount = medications.filter((m) => m.report_id === r.id).length;
      const tests = labValues.filter((l) => l.report_id === r.id);
      const abnormalCount = tests.filter((l) => l.status !== "normal").length;
      badges[r.id] = { medCount, abnormalCount, totalTests: tests.length };
    });
    return badges;
  }, [reports, medications, labValues]);

  // Trends chart data for the selected test
  const trendData = useMemo(() => {
    if (!selectedTest) return [];

    const items = labValues
      .filter((l) => l.test_name === selectedTest)
      .sort((a, b) => {
        const da = a.report_date ? new Date(a.report_date).getTime() : 0;
        const db = b.report_date ? new Date(b.report_date).getTime() : 0;
        return da - db;
      });

    return items.map((item) => {
      const formattedDate = item.report_date
        ? new Date(item.report_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "Recorded";

      return {
        date: formattedDate,
        value: item.value,
        unit: item.unit,
        ref_low: item.ref_low,
        ref_high: item.ref_high,
        ref_text: item.ref_text,
        status: item.status,
      };
    });
  }, [labValues, selectedTest]);

  // Comparison for Trends: Improved / Worsened / Stable
  const trendStatus = useMemo(() => {
    if (trendData.length < 2) return { label: "Baseline Recorded", type: "stable" };
    const latest = trendData[trendData.length - 1];
    const previous = trendData[trendData.length - 2];

    if (latest.status === "normal" && previous.status !== "normal") {
      return { label: "Improved", type: "improved" };
    }
    if (latest.status !== "normal" && previous.status === "normal") {
      return { label: "Needs Attention", type: "worsened" };
    }
    if (latest.status === "normal" && previous.status === "normal") {
      return { label: "Stable (Normal)", type: "improved" };
    }

    // Both abnormal: check proximity to normal range
    if (latest.ref_high !== null && latest.ref_low !== null) {
      const prevMid = (previous.ref_low! + previous.ref_high!) / 2;
      const latMid = (latest.ref_low + latest.ref_high) / 2;
      const prevDiff = Math.abs(previous.value - prevMid);
      const latDiff = Math.abs(latest.value - latMid);
      if (latDiff < prevDiff) return { label: "Improving", type: "improved" };
      if (latDiff > prevDiff) return { label: "Worsened", type: "worsened" };
    }

    return { label: "Stable", type: "stable" };
  }, [trendData]);

  // Theme chart colors
  const tealColor = isDark ? "#14b8a6" : "#0d9488";
  const textColor = isDark ? "#94a3b8" : "#64748b";
  const refBandColor = isDark ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.15)";

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

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-28 glass-strong rounded-3xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-28 glass rounded-3xl" />
            <div className="h-28 glass rounded-3xl" />
            <div className="h-28 glass rounded-3xl" />
          </div>
          <div className="h-72 glass-strong rounded-3xl" />
          <div className="h-96 glass rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  // Friendly Empty State when 0 documents exist
  if (reports.length === 0) {
    return (
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="glass p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {profile?.full_name || "Patient Profile"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-foreground/70">
                {profile?.age && <span>{profile.age} yrs</span>}
                {profile?.age && profile?.gender && <span>•</span>}
                {profile?.gender && <span>{profile.gender}</span>}
                {profile?.abha_linked ? (
                  <span
                    title={`ABHA: ${profile.abha_address || profile.abha_number || "Linked"}`}
                    className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ABHA linked (demo)
                  </span>
                ) : (
                  <Link
                    href="/profile"
                    title="Link your ABHA ID (Demo)"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {t("status_abha_not_linked")}
                  </Link>
                )}
              </div>
            </div>

            <Link href="/upload" className="glass-button text-xs sm:text-sm !py-2.5 !px-5 self-start sm:self-auto">
              <UploadCloud className="w-4 h-4" />
              {t("btn_upload_new")}
            </Link>
          </div>

          {/* Empty State Banner */}
          <div className="glass-strong p-10 sm:p-14 rounded-3xl text-center space-y-4 border border-white/40 dark:border-white/10 shadow-lg">
            <div className="w-16 h-16 rounded-3xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {t("dash_empty_title")}
            </h2>
            <p className="text-xs sm:text-sm text-foreground/70 max-w-md mx-auto leading-relaxed">
              {t("dash_empty_desc")}
            </p>
            <div className="pt-3">
              <Link href="/upload" className="glass-button text-sm !py-3 !px-7 shadow-lg">
                <UploadCloud className="w-4 h-4" />
                {t("btn_upload_new")}
              </Link>
            </div>
          </div>
        </div>
      </AppShell>

    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* (1) Glass Profile Header */}
        <div className="glass p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-500 text-white flex items-center justify-center font-bold text-base shadow-md">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {profile?.full_name || "Patient Profile"}
                </h1>
                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-foreground/70 font-medium">
                  {profile?.age && <span>{profile.age} years old</span>}
                  {profile?.age && profile?.gender && <span>•</span>}
                  {profile?.gender && <span>{profile.gender}</span>}
                  <span>•</span>
                  {/* ABHA Chip */}
                  {profile?.abha_linked ? (
                    <span
                      title={`ABHA: ${profile.abha_address || profile.abha_number || "Linked"}`}
                      className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ABHA linked (demo)
                    </span>
                  ) : (
                    <Link
                      href="/profile"
                      title="Link your ABHA ID (Demo)"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {t("status_abha_not_linked")}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <Link
              href="/upload"
              id="dashboard-upload-cta"
              className="glass-button text-xs sm:text-sm !py-2.5 !px-5 shadow-md flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{t("btn_upload_new")}</span>
            </Link>
          </div>
        </div>

        {/* (2) Three Stat Cards with Animated Count-up */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Documents */}
          <div className="glass p-5 rounded-3xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/70 font-semibold uppercase tracking-wider">
                {t("dash_total_docs")}
              </span>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              <AnimatedCounter value={totalDocuments} />
            </div>
            <p className="text-[11px] text-foreground/60">Indexed in your health timeline</p>
          </div>

          {/* Card 2: Active Medicines */}
          <div className="glass p-5 rounded-3xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/70 font-semibold uppercase tracking-wider">
                {t("dash_active_meds")}
              </span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Pill className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              <AnimatedCounter value={activeMedicinesCount} />
            </div>
            <p className="text-[11px] text-foreground/60">From current prescriptions</p>
          </div>

          {/* Card 3: Abnormal Values in Latest Lab Report */}
          <div className="glass p-5 rounded-3xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/70 font-semibold uppercase tracking-wider">
                {t("dash_abnormal_latest")}
              </span>
              <div
                className={`p-2 rounded-xl ${
                  latestLabReportAbnormals > 0
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              <AnimatedCounter value={latestLabReportAbnormals} />
            </div>
            <p className="text-[11px] text-foreground/60">
              {latestLabReportAbnormals > 0
                ? "Flagged for discussion with doctor"
                : "All metrics in reference range"}
            </p>
          </div>
        </div>


        {/* (6) Health Trends Glass Card */}
        {testNames.length > 0 && (
          <div className="glass-strong p-6 sm:p-7 rounded-3xl space-y-5 border border-white/40 dark:border-white/10 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-500" />
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    {t("dash_trends_title")}
                  </h2>
                </div>
                <p className="text-xs text-foreground/60 pt-0.5">
                  {t("dash_trends_subtitle")}
                </p>
              </div>


              <div className="flex flex-wrap items-center gap-2.5">
                {/* Status Badge: Improved / Worsened / Stable */}
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                    trendStatus.type === "improved"
                      ? "badge-normal"
                      : trendStatus.type === "worsened"
                      ? "badge-high"
                      : "bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30"
                  }`}
                >
                  {trendStatus.type === "improved" && <TrendingUp className="w-3.5 h-3.5" />}
                  {trendStatus.type === "worsened" && <TrendingDown className="w-3.5 h-3.5" />}
                  {trendStatus.type === "stable" && <Minus className="w-3.5 h-3.5" />}
                  <span>{trendStatus.label}</span>
                </span>

                {/* Dropdown to pick test */}
                <select
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  className="px-3.5 py-1.5 rounded-2xl glass text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 border border-white/40 dark:border-white/15 cursor-pointer bg-white/70 dark:bg-slate-900/70"
                >
                  {testNames.map((name) => (
                    <option
                      key={name}
                      value={name}
                      className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tealColor} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={tealColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke={textColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={textColor} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="glass-strong p-3 rounded-2xl border border-white/30 dark:border-white/15 shadow-xl text-xs space-y-1">
                            <p className="font-bold text-foreground">{selectedTest}</p>
                            <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
                              {d.value} {d.unit}
                            </p>
                            {d.ref_text && (
                              <p className="text-[10px] text-foreground/60">
                                Normal: {d.ref_text}
                              </p>
                            )}
                            <span
                              className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                d.status === "high"
                                  ? "badge-high"
                                  : d.status === "low"
                                  ? "badge-low"
                                  : "badge-normal"
                              }`}
                            >
                              {d.status}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Shaded Reference Range Band */}
                  {trendData.length > 0 &&
                    trendData[0].ref_low !== null &&
                    trendData[0].ref_high !== null && (
                      <ReferenceArea
                        y1={trendData[0].ref_low}
                        y2={trendData[0].ref_high}
                        fill={refBandColor}
                        stroke="none"
                      />
                    )}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={tealColor}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#trendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Two-Column Row: (4) Current Medicines & (5) Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* (4) Current Medicines Glass Card */}
          <div className="glass p-6 sm:p-7 rounded-3xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <Pill className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">
                    {t("dash_current_meds_title")}
                  </h2>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full glass text-foreground/70">
                  {medications.length} Prescribed
                </span>
              </div>

              {medications.length === 0 ? (
                <div className="p-6 rounded-2xl glass-strong text-center text-xs text-foreground/60 space-y-1">
                  <Pill className="w-6 h-6 mx-auto text-foreground/40 mb-1" />
                  <p className="font-semibold text-foreground">No active medicines logged</p>
                  <p>Upload a doctor&apos;s prescription to extract medications and dosing schedules.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {medications.slice(0, 5).map((med) => (
                    <div
                      key={med.id}
                      className="p-3.5 rounded-2xl glass-strong border border-white/30 dark:border-white/10 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-sm">{med.name}</span>
                        {med.strength && (
                          <span className="text-[11px] font-medium text-foreground/60">
                            {med.strength}
                          </span>
                        )}
                      </div>

                      {med.frequency && (
                        <div className="flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-300 font-medium">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{t("rep_schedule")}: {med.frequency}</span>
                        </div>
                      )}

                      {(med.dosage || med.duration) && (
                        <div className="flex items-center gap-3 text-[11px] text-foreground/60">
                          {med.dosage && <span>{t("rep_dose")}: {med.dosage}</span>}
                          {med.duration && <span>{t("rep_duration")}: {med.duration}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {medications.length > 5 && (
              <p className="text-[11px] text-foreground/50 pt-2 text-center">
                Showing top 5 of {medications.length} medicines
              </p>
            )}
          </div>

          {/* (5) Conditions Glass Card */}
          <div className="glass p-6 sm:p-7 rounded-3xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">
                    {t("dash_conditions_title")}
                  </h2>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full glass text-foreground/70">
                  {conditions.length} Tracked
                </span>
              </div>

              {conditions.length === 0 ? (
                <div className="p-6 rounded-2xl glass-strong text-center text-xs text-foreground/60 space-y-1">
                  <HeartPulse className="w-6 h-6 mx-auto text-foreground/40 mb-1" />
                  <p className="font-semibold text-foreground">No conditions documented</p>
                  <p>Diagnoses from your doctor or discharge papers will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {conditions.map((cond) => (
                    <div
                      key={cond.id}
                      className="p-3.5 rounded-2xl glass-strong border border-white/30 dark:border-white/10 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-sm">{cond.name}</span>
                        {cond.status && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                            {cond.status}
                          </span>
                        )}
                      </div>
                      {cond.notes && (
                        <p className="text-[11px] text-foreground/70 leading-relaxed">
                          {cond.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 text-[11px] text-foreground/50 text-center">
              Extracted from medical records
            </div>
          </div>
        </div>

        {/* (3) Health Timeline Glass Card */}
        <div className="glass p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-500" />
                <h2 className="text-lg font-bold text-foreground">
                  {t("dash_timeline_title")}
                </h2>
              </div>

              <p className="text-xs text-foreground/60 pt-0.5">
                All records chronological, grouped by month
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All" },
                { id: "lab_report", label: "Lab Reports" },
                { id: "prescription", label: "Prescriptions" },
                { id: "discharge_summary", label: "Discharge Summaries" },
                { id: "diagnostic_imaging", label: "Imaging" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setTimelineFilter(chip.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    timelineFilter === chip.id
                      ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                      : "glass text-foreground/70 hover:border-teal-500/30"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Items Grouped by Month */}
          {Object.keys(groupedTimeline).length === 0 ? (
            <div className="p-8 rounded-2xl glass-strong text-center text-xs text-foreground/60">
              No records found for the selected filter.
            </div>
          ) : (
            <div className="space-y-8 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-gradient-to-b before:from-teal-500/40 before:to-transparent">
              {Object.entries(groupedTimeline).map(([month, monthReports]) => (
                <div key={month} className="space-y-3 relative">
                  {/* Month header badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-teal-500/30 text-xs font-bold text-teal-700 dark:text-teal-300 ml-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span>{month}</span>
                  </div>

                  {/* Month Records */}
                  <div className="space-y-3 pl-2 sm:pl-4">
                    {monthReports.map((report) => {
                      const { icon: DocIcon, color, bg, label: typeLabel } = getDocTypeIcon(report.doc_type);
                      const badges = reportBadges[report.id] || { medCount: 0, abnormalCount: 0, totalTests: 0 };

                      return (
                        <Link
                          key={report.id}
                          href={`/reports/${report.id}`}
                          className="group block p-4 sm:p-5 rounded-2xl glass-strong border border-white/40 dark:border-white/10 hover:border-teal-500/50 hover:-translate-y-0.5 transition-all shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5">
                              {/* Doc Icon */}
                              <div className={`w-10 h-10 rounded-2xl ${bg} ${color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                                <DocIcon className="w-5 h-5" />
                              </div>

                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-foreground/75">
                                    {typeLabel}
                                  </span>
                                  {report.report_date && (
                                    <span className="text-xs text-foreground/50">
                                      {report.report_date}
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                  {report.title}
                                </h3>

                                {(report.doctor_name || report.facility) && (
                                  <p className="text-xs text-foreground/60">
                                    {[report.doctor_name, report.facility].filter(Boolean).join(" • ")}
                                  </p>
                                )}

                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                                  {badges.medCount > 0 && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                                      {badges.medCount} medicine{badges.medCount > 1 ? "s" : ""}
                                    </span>
                                  )}
                                  {badges.totalTests > 0 && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                      {badges.totalTests} test{badges.totalTests > 1 ? "s" : ""}
                                    </span>
                                  )}
                                  {badges.abnormalCount > 0 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                      <ShieldAlert className="w-3 h-3" />
                                      {badges.abnormalCount} abnormal
                                    </span>
                                  )}
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
                                </div>
                              </div>
                            </div>

                            <ChevronRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all mt-3 shrink-0" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
