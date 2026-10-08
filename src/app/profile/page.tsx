"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { createClient } from "@/utils/supabase/client";
import {
  UserCheck,
  Mail,
  Calendar,
  Save,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Download,
  CheckCircle2,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

interface ProfileData {
  full_name: string;
  age: string;
  gender: string;
  abha_number: string;
  abha_address: string;
  abha_linked: boolean;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    age: "",
    gender: "",
    abha_number: "",
    abha_address: "",
    abha_linked: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ABHA Demo state
  const [abhaNumberInput, setAbhaNumberInput] = useState("");
  const [abhaAddressInput, setAbhaAddressInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [importingAbha, setImportingAbha] = useState(false);
  const [exportingFhir, setExportingFhir] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUser(user);
          const { data, error } = await supabase
            .from("profiles")
            .select("full_name, age, gender, abha_number, abha_address, abha_linked")
            .eq("id", user.id)
            .single();

          if (data && !error) {
            setProfile({
              full_name: data.full_name || user.user_metadata?.full_name || "",
              age: data.age ? String(data.age) : "",
              gender: data.gender || "",
              abha_number: data.abha_number || "",
              abha_address: data.abha_address || "",
              abha_linked: Boolean(data.abha_linked),
            });
            if (data.abha_number) setAbhaNumberInput(data.abha_number);
            if (data.abha_address) setAbhaAddressInput(data.abha_address);
          } else {
            setProfile({
              full_name: user.user_metadata?.full_name || "",
              age: "",
              gender: "",
              abha_number: "",
              abha_address: "",
              abha_linked: false,
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Format ABHA number as XX-XXXX-XXXX-XXXX
  const handleAbhaNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 14);
    let formatted = "";
    if (raw.length > 0) formatted += raw.slice(0, 2);
    if (raw.length > 2) formatted += "-" + raw.slice(2, 6);
    if (raw.length > 6) formatted += "-" + raw.slice(6, 10);
    if (raw.length > 10) formatted += "-" + raw.slice(10, 14);
    setAbhaNumberInput(formatted);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const abhaRegex = /^\d{2}-\d{4}-\d{4}-\d{4}$/;
    if (!abhaRegex.test(abhaNumberInput.trim())) {
      toast.error("Please enter a valid 14-digit ABHA number in format XX-XXXX-XXXX-XXXX");
      return;
    }

    if (!abhaAddressInput.trim() || !abhaAddressInput.includes("@")) {
      toast.error("Please enter a valid ABHA address (e.g. username@sbx)");
      return;
    }

    setOtpSent(true);
    toast.info("Demo OTP 123456 sent to linked mobile number!");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (otpInput.trim() !== "123456") {
      toast.error("Invalid OTP. Use demo OTP: 123456");
      return;
    }

    setVerifyingOtp(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          abha_number: abhaNumberInput.trim(),
          abha_address: abhaAddressInput.trim(),
          abha_linked: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      setProfile((prev) => ({
        ...prev,
        abha_number: abhaNumberInput.trim(),
        abha_address: abhaAddressInput.trim(),
        abha_linked: true,
      }));
      setOtpSent(false);
      setOtpInput("");
      toast.success("ABHA successfully linked (demo mode)!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to link ABHA";
      toast.error(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleUnlinkAbha = async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          abha_linked: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw new Error(error.message);

      setProfile((prev) => ({ ...prev, abha_linked: false }));
      setOtpSent(false);
      toast.success("ABHA unlinked");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to unlink ABHA";
      toast.error(msg);
    }
  };

  const handleImportSampleRecords = async () => {
    setImportingAbha(true);
    try {
      const res = await fetch("/api/abha/import", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Import failed");
      }

      toast.success(
        `Imported ${data.count || 2} records from ABHA (demo)! Check your Health Timeline.`,
        { duration: 5000 }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to import ABHA records";
      toast.error(msg);
    } finally {
      setImportingAbha(false);
    }
  };

  const handleDownloadFullHealthRecord = async () => {
    setExportingFhir(true);
    try {
      const res = await fetch("/api/fhir/export");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to download record");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arogya_full_health_record_fhir_${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Full health record (FHIR R4) downloaded!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Export failed";
      toast.error(msg);
    } finally {
      setExportingFhir(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: profile.full_name.trim(),
            age: profile.age ? parseInt(profile.age, 10) : null,
            gender: profile.gender,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Profile demographics updated successfully!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-28 glass rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80 glass rounded-3xl" />
            <div className="h-80 glass rounded-3xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="glass p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Identity & ABDM Integration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Health Profile & ABHA Link
            </h1>
            <p className="text-xs sm:text-sm text-foreground/70 max-w-xl">
              Connect your Ayushman Bharat Health Account (ABHA) sandbox to aggregate diagnostic records, prescriptions, and export FHIR R4 bundles.
            </p>
          </div>

          {/* Quick status chip in header */}
          <div className="self-start sm:self-auto">
            {profile.abha_linked ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ABHA linked (demo)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>ABHA not linked</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Card 1: ABHA (demo) Glass Card */}
          <div className="glass-strong p-6 sm:p-8 rounded-3xl border border-white/40 dark:border-white/10 shadow-xl space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    ABHA (demo)
                  </h2>
                </div>
                <p className="text-xs text-foreground/70">
                  Simulate linking your national Ayushman Bharat Health ID
                </p>
              </div>

              {/* Status Badge */}
              {profile.abha_linked ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ABHA linked (demo)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Unlinked
                </span>
              )}
            </div>

            {/* Prominent Demo Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold">Demo mode, not connected to the real ABDM</p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                  This integration operates inside a safe simulation environment. No live government servers or actual Aadhaar/ABDM credentials are used.
                </p>
              </div>
            </div>

            {profile.abha_linked ? (
              /* Linked State View */
              <div className="space-y-5 pt-2">
                <div className="p-4 rounded-2xl glass space-y-3 border border-emerald-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/60 font-medium">14-Digit ABHA Number:</span>
                    <span className="font-mono font-bold text-foreground">{profile.abha_number}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/60 font-medium">ABHA Address:</span>
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{profile.abha_address}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/60 font-medium">ABDM Sandbox Status:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Active (Demo)
                    </span>
                  </div>
                </div>

                {/* Import Records & Export Full Health Record Buttons */}
                <div className="space-y-3 pt-1">
                  <button
                    type="button"
                    onClick={handleImportSampleRecords}
                    disabled={importingAbha}
                    className="w-full glass-button !py-3 !px-4 text-xs sm:text-sm flex items-center justify-center gap-2 bg-teal-500/15 hover:bg-teal-500/25 text-teal-800 dark:text-teal-200 border border-teal-500/30"
                  >
                    {importingAbha ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                        <span>Importing ABDM FHIR Records...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-teal-500" />
                        <span>Import records from ABHA (demo)</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-foreground/60 text-center">
                    Ingests sample FHIR R4 prescription & lab bundles into your timeline with the <span className="font-semibold text-teal-600 dark:text-teal-400">&ldquo;ABHA import&rdquo;</span> badge.
                  </p>
                </div>

                <div className="pt-2 border-t border-white/20 dark:border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleUnlinkAbha}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                  >
                    Unlink ABHA account
                  </button>

                  <Link
                    href="/dashboard"
                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                  >
                    View in Timeline →
                  </Link>
                </div>
              </div>
            ) : (
              /* Unlinked State: Form with OTP Step */
              <div className="space-y-4 pt-1">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="abha-number-input" className="text-xs font-semibold text-foreground/80 block">
                        14-Digit ABHA Number (XX-XXXX-XXXX-XXXX)
                      </label>
                      <input
                        id="abha-number-input"
                        type="text"
                        value={abhaNumberInput}
                        onChange={handleAbhaNumberChange}
                        placeholder="e.g. 91-8274-1928-3019"
                        maxLength={17}
                        className="w-full px-4 py-2.5 rounded-2xl glass font-mono text-sm tracking-wide text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                        required
                      />
                      <p className="text-[11px] text-foreground/50">
                        Format validated automatically: 14 digits with hyphens
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="abha-address-input" className="text-xs font-semibold text-foreground/80 block">
                        ABHA Address (PHR Handle)
                      </label>
                      <input
                        id="abha-address-input"
                        type="text"
                        value={abhaAddressInput}
                        onChange={(e) => setAbhaAddressInput(e.target.value)}
                        placeholder="username@sbx"
                        className="w-full px-4 py-2.5 rounded-2xl glass text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                        required
                      />
                      <p className="text-[11px] text-foreground/50">
                        Example: <code className="text-teal-600 dark:text-teal-400">patient@sbx</code>
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full glass-button !py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Send OTP (Simulated)</span>
                    </button>
                  </form>
                ) : (
                  /* OTP Step */
                  <form onSubmit={handleVerifyOtp} className="space-y-4 p-4 rounded-2xl glass border border-teal-500/30">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Enter Verification OTP</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold">
                          Hint: Demo OTP is 123456
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground/70">
                        Enter the simulated 6-digit one-time passcode sent to your registered number.
                      </p>
                    </div>

                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full px-4 py-3 rounded-2xl glass font-mono text-center tracking-[0.5em] text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                      autoFocus
                      required
                    />

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="w-1/3 py-2 px-3 rounded-xl glass text-xs text-foreground/70 hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={verifyingOtp}
                        className="w-2/3 glass-button !py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1.5"
                      >
                        {verifyingOtp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verify &amp; Link ABHA</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Download Full Health Record (FHIR) Button */}
            <div className="pt-4 border-t border-white/20 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Full Health Record (FHIR R4)</h3>
                  <p className="text-[11px] text-foreground/60">Export all diagnostic and clinical bundles as single JSON</p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadFullHealthRecord}
                  disabled={exportingFhir}
                  className="glass-button text-xs !py-2 !px-3.5 flex items-center gap-1.5"
                >
                  {exportingFhir ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download my full health record (FHIR)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Personal Demographics Form */}
          <div className="glass-strong p-6 sm:p-8 rounded-3xl border border-white/40 dark:border-white/10 shadow-xl space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">
                Patient Demographics
              </h2>
              <p className="text-xs text-foreground/70">
                Personal attributes used to tune reference ranges and calibrate lab insights
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 block">
                  Account Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground/40">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass opacity-70 cursor-not-allowed text-foreground text-sm"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="profile-fullname" className="text-xs font-semibold text-foreground/80 block">
                  Full Legal Name
                </label>
                <input
                  id="profile-fullname"
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="e.g. Sriviswanadham"
                  className="w-full px-4 py-2.5 rounded-2xl glass text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  required
                />
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label htmlFor="profile-age" className="text-xs font-semibold text-foreground/80 block">
                  Age (years)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground/40">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-age"
                    type="number"
                    min="1"
                    max="130"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    placeholder="e.g. 30"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label htmlFor="profile-gender" className="text-xs font-semibold text-foreground/80 block">
                  Biological Sex / Gender
                </label>
                <select
                  id="profile-gender"
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl glass text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value="" className="text-foreground bg-slate-900">Select option</option>
                  <option value="Male" className="text-foreground bg-slate-900">Male</option>
                  <option value="Female" className="text-foreground bg-slate-900">Female</option>
                  <option value="Non-Binary" className="text-foreground bg-slate-900">Non-Binary</option>
                  <option value="Prefer not to say" className="text-foreground bg-slate-900">Prefer not to say</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="glass-button !py-2.5 !px-6 text-xs sm:text-sm flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Demographics</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
