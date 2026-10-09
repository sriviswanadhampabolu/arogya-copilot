"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/navigation/app-shell";
import { createClient } from "@/utils/supabase/client";
import {
  UserCheck,
  ShieldAlert,
  Download,
  Loader2,
  Save,
  Mail,
  Calendar,
  UploadCloud,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Camera,
  ExternalLink,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileState {
  full_name: string;
  age: string;
  gender: string;
  abha_number: string;
  abha_address: string;
  abha_linked: boolean;
}

interface AbhaCardExtracted {
  abha_number: string | null;
  abha_address: string | null;
  name: string | null;
  dob: string | null;
  gender: string | null;
  confidence: number;
}

interface FhirImportResult {
  reportId?: string;
  title?: string;
  summary?: string;
  imported: {
    reports: number;
    conditions: number;
    medications: number;
    observations: number;
  };
  skipped: Array<{ resourceType: string; reason: string }>;
  warnings: string[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAbha, setSavingAbha] = useState(false);
  const [exportingFhir, setExportingFhir] = useState(false);

  // Profile data
  const [profile, setProfile] = useState<ProfileState>({
    full_name: "",
    age: "",
    gender: "",
    abha_number: "",
    abha_address: "",
    abha_linked: false,
  });

  // ABHA Form state
  const [isEditingAbha, setIsEditingAbha] = useState(false);
  const [abhaNumberInput, setAbhaNumberInput] = useState("");
  const [abhaAddressInput, setAbhaAddressInput] = useState("");

  // Scan ABHA card state
  const [scanningCard, setScanningCard] = useState(false);
  const [extractedCard, setExtractedCard] = useState<AbhaCardExtracted | null>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);

  // FHIR Import state
  const [importingFhir, setImportingFhir] = useState(false);
  const [fhirResult, setFhirResult] = useState<FhirImportResult | null>(null);
  const fhirFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser(authUser);
          const { data } = await supabase
            .from("profiles")
            .select("full_name, age, gender, abha_number, abha_address, abha_linked")
            .eq("id", authUser.id)
            .single();

          if (data) {
            setProfile({
              full_name: data.full_name || "",
              age: data.age !== null && data.age !== undefined ? String(data.age) : "",
              gender: data.gender || "",
              abha_number: data.abha_number || "",
              abha_address: data.abha_address || "",
              abha_linked: Boolean(data.abha_linked),
            });
            if (data.abha_number) setAbhaNumberInput(data.abha_number);
            if (data.abha_address) setAbhaAddressInput(data.abha_address);
          } else {
            setProfile({
              full_name: authUser.user_metadata?.full_name || "",
              age: "",
              gender: "",
              abha_number: "",
              abha_address: "",
              abha_linked: false,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
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

  // Save ABHA Details (Honest, self-declared flow)
  const handleSaveAbhaDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const abhaRegex = /^\d{2}-\d{4}-\d{4}-\d{4}$/;
    if (!abhaRegex.test(abhaNumberInput.trim())) {
      toast.error("Please enter a valid 14-digit ABHA number in format XX-XXXX-XXXX-XXXX");
      return;
    }

    if (!abhaAddressInput.trim() || !abhaAddressInput.includes("@")) {
      toast.error("Please enter a valid ABHA address (e.g. username@abdm or username@sbx)");
      return;
    }

    setSavingAbha(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          abha_number: abhaNumberInput.trim(),
          abha_address: abhaAddressInput.trim(),
          abha_linked: true,
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
      setIsEditingAbha(false);
      setExtractedCard(null);
      toast.success("ABHA details saved successfully as self-declared!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save ABHA details";
      toast.error(msg);
    } finally {
      setSavingAbha(false);
    }
  };

  // Remove / Unlink ABHA
  const handleRemoveAbha = async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          abha_linked: false,
          abha_number: null,
          abha_address: null,
        })
        .eq("id", user.id);

      if (error) throw new Error(error.message);

      setProfile((prev) => ({
        ...prev,
        abha_linked: false,
        abha_number: "",
        abha_address: "",
      }));
      setAbhaNumberInput("");
      setAbhaAddressInput("");
      setIsEditingAbha(false);
      setExtractedCard(null);
      toast.success("ABHA details removed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove ABHA";
      toast.error(msg);
    }
  };

  // Scan ABHA Card using Gemini OCR
  const handleCardFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG or PNG) of your ABHA card.");
      return;
    }

    setScanningCard(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");

      const res = await fetch("/api/abha/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: file.type,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to scan ABHA card.");
      }

      const cardData: AbhaCardExtracted = json.data;
      setExtractedCard(cardData);

      if (cardData.abha_number) {
        setAbhaNumberInput(cardData.abha_number);
      }
      if (cardData.abha_address) {
        setAbhaAddressInput(cardData.abha_address);
      }
      setIsEditingAbha(true);

      toast.success("ABHA card scanned! Please verify the details below and save.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Card scanning failed";
      toast.error(msg);
    } finally {
      setScanningCard(false);
      if (cardFileInputRef.current) {
        cardFileInputRef.current.value = "";
      }
    }
  };

  // Import FHIR records from user-uploaded JSON bundle
  const handleFhirFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB size limit.");
      return;
    }

    setImportingFhir(true);
    setFhirResult(null);

    try {
      const text = await file.text();
      const res = await fetch("/api/fhir/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "FHIR bundle import failed.");
      }

      setFhirResult(data);
      toast.success(
        `Imported ${data.imported.observations} tests, ${data.imported.medications} medicines, and ${data.imported.conditions} conditions!`,
        { duration: 5000 }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
      toast.error(msg);
    } finally {
      setImportingFhir(false);
      if (fhirFileInputRef.current) {
        fhirFileInputRef.current.value = "";
      }
    }
  };

  // Instant import for sample bundle files
  const handleImportSampleFile = async (samplePath: string, name: string) => {
    setImportingFhir(true);
    setFhirResult(null);
    try {
      const sampleRes = await fetch(samplePath);
      if (!sampleRes.ok) throw new Error("Could not load sample file");
      const sampleText = await sampleRes.text();

      const res = await fetch("/api/fhir/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: sampleText,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Import failed");
      }

      setFhirResult(data);
      toast.success(`Imported sample "${name}" successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sample import failed";
      toast.error(msg);
    } finally {
      setImportingFhir(false);
    }
  };

  // Export full health record
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

  // Save Demographics
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
              <span>Identity &amp; ABDM Integration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Health Profile &amp; ABHA ID
            </h1>
            <p className="text-xs sm:text-sm text-foreground/70 max-w-xl">
              Add your Ayushman Bharat Health Account (ABHA) details, scan your card, or import ABDM-compliant FHIR R4 records into your personal timeline.
            </p>
          </div>

          {/* Quick status chip in header */}
          <div className="self-start sm:self-auto">
            {profile.abha_linked ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>ABHA added (self-declared)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>No ABHA added</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Card 1: ABHA health ID */}
          <div className="glass-strong p-6 sm:p-8 rounded-3xl border border-white/40 dark:border-white/10 shadow-xl space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    ABHA health ID
                  </h2>
                </div>
                <p className="text-xs text-foreground/70">
                  Manage your national digital health account identifiers
                </p>
              </div>

              {/* Status Badge */}
              {profile.abha_linked ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  ABHA added (self-declared)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Not added
                </span>
              )}
            </div>

            {/* Honest Disclaimer Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-[11px] text-amber-700/90 dark:text-amber-300/90 leading-relaxed font-medium">
                  Not connected to the live ABDM network. ABHA details are added by you or read from your ABHA card and are not verified with ABDM.
                </p>
              </div>
            </div>

            {/* Hidden File Input for Card Scanning */}
            <input
              ref={cardFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleCardFileSelected}
              className="hidden"
            />

            {/* Hidden File Input for FHIR Bundle Import */}
            <input
              ref={fhirFileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFhirFileSelected}
              className="hidden"
            />

            {/* Display View when ABHA is added and not editing */}
            {profile.abha_linked && !isEditingAbha ? (
              <div className="space-y-4 pt-1">
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
                    <span className="text-foreground/60 font-medium">Verification Status:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Self-Declared
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingAbha(true)}
                    className="glass-button !py-2 !px-3.5 text-xs flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit details</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveAbha}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove ABHA</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Form to Add or Edit ABHA details */
              <div className="space-y-4 pt-1">
                {/* Scan Card Button Trigger */}
                <div className="p-3 rounded-2xl glass border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <p className="text-xs font-bold text-foreground">Have a photo of your ABHA card?</p>
                    <p className="text-[11px] text-foreground/60">
                      Gemini OCR will read the 14-digit number and address directly from the card.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cardFileInputRef.current?.click()}
                    disabled={scanningCard}
                    className="glass-button text-xs !py-2 !px-3 flex items-center justify-center gap-1.5 shrink-0 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300"
                  >
                    {scanningCard ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Scanning Card...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5" />
                        <span>Scan ABHA card</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Card Scan Extracted Confirmation Chip */}
                {extractedCard && (
                  <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 space-y-1.5 text-xs text-teal-900 dark:text-teal-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1 text-teal-700 dark:text-teal-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Extracted from Card
                      </span>
                      <span className="text-[10px] font-mono opacity-80">
                        Confidence: {Math.round(extractedCard.confidence * 100)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-foreground/75">
                      {extractedCard.name && <div>Name: <strong className="text-foreground">{extractedCard.name}</strong></div>}
                      {extractedCard.dob && <div>DOB: <strong className="text-foreground">{extractedCard.dob}</strong></div>}
                      {extractedCard.gender && <div>Gender: <strong className="text-foreground">{extractedCard.gender}</strong></div>}
                    </div>
                    <p className="text-[11px] text-teal-700 dark:text-teal-300 pt-0.5">
                      Verify pre-filled fields below and click &ldquo;Save ABHA details&rdquo; to confirm.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSaveAbhaDetails} className="space-y-4">
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
                      Standard 14-digit format separated by hyphens
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
                      placeholder="username@abdm or username@sbx"
                      className="w-full px-4 py-2.5 rounded-2xl glass text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                      required
                    />
                    <p className="text-[11px] text-foreground/50">
                      Format: <code className="text-teal-600 dark:text-teal-400">user@abdm</code> or <code className="text-teal-600 dark:text-teal-400">user@sbx</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {profile.abha_linked && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingAbha(false);
                          setExtractedCard(null);
                        }}
                        className="py-2.5 px-4 rounded-xl glass text-xs text-foreground/70 hover:text-foreground"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={savingAbha}
                      className="flex-1 glass-button !py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2"
                    >
                      {savingAbha ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save ABHA details</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Import FHIR Records Section */}
            <div className="pt-4 border-t border-white/20 dark:border-white/10 space-y-3">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-foreground">Import FHIR Clinical Records</h3>
                <p className="text-[11px] text-foreground/60">
                  Upload an HL7 FHIR R4 Bundle (.json) to populate your health timeline with verified clinical records.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => fhirFileInputRef.current?.click()}
                  disabled={importingFhir}
                  className="glass-button !py-2.5 !px-4 text-xs flex items-center justify-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-800 dark:text-teal-200 border border-teal-500/30"
                >
                  {importingFhir ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating &amp; Importing Bundle...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 text-teal-500" />
                      <span>Import FHIR records (.json)</span>
                    </>
                  )}
                </button>

                <div className="text-[11px] text-foreground/50 text-center sm:text-left self-center">
                  Max 5MB • Safe validation &amp; execution isolated
                </div>
              </div>

              {/* Sample Files / Try a sample file */}
              <div className="p-3 rounded-2xl glass text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground/80 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-teal-500" />
                    Try a sample file:
                  </span>
                  <span className="text-[10px] text-foreground/40">Made-up demo data</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <a
                      href="/sample-fhir/sample-prescription.json"
                      download
                      className="px-2.5 py-1 rounded-xl glass hover:bg-teal-500/15 text-[11px] font-mono text-teal-600 dark:text-teal-300 flex items-center gap-1"
                      title="Download sample prescription JSON"
                    >
                      <Download className="w-3 h-3" />
                      <span>sample-prescription.json</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleImportSampleFile("/sample-fhir/sample-prescription.json", "Prescription Bundle")}
                      disabled={importingFhir}
                      className="px-2 py-1 rounded-xl glass hover:bg-teal-500/20 text-[11px] font-semibold text-teal-700 dark:text-teal-200"
                    >
                      Import
                    </button>
                  </div>

                  <span className="text-foreground/30">•</span>

                  <div className="flex items-center gap-1">
                    <a
                      href="/sample-fhir/sample-lab-report.json"
                      download
                      className="px-2.5 py-1 rounded-xl glass hover:bg-teal-500/15 text-[11px] font-mono text-teal-600 dark:text-teal-300 flex items-center gap-1"
                      title="Download sample lab report JSON"
                    >
                      <Download className="w-3 h-3" />
                      <span>sample-lab-report.json</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleImportSampleFile("/sample-fhir/sample-lab-report.json", "Lab Report Bundle")}
                      disabled={importingFhir}
                      className="px-2 py-1 rounded-xl glass hover:bg-teal-500/20 text-[11px] font-semibold text-teal-700 dark:text-teal-200"
                    >
                      Import
                    </button>
                  </div>
                </div>
              </div>

              {/* Import Result Summary Card */}
              {fhirResult && (
                <div className="p-4 rounded-2xl glass-strong border border-emerald-500/30 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      FHIR Bundle Imported Successfully
                    </span>
                    <Link
                      href="/dashboard"
                      className="text-[11px] text-teal-600 dark:text-teal-300 hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <span>View in Timeline</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                    <div className="p-2 rounded-xl glass">
                      <div className="text-xs text-foreground/60">Reports</div>
                      <div className="text-base font-bold text-foreground">{fhirResult.imported.reports}</div>
                    </div>
                    <div className="p-2 rounded-xl glass">
                      <div className="text-xs text-foreground/60">Lab Tests</div>
                      <div className="text-base font-bold text-teal-600 dark:text-teal-400">
                        {fhirResult.imported.observations}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl glass">
                      <div className="text-xs text-foreground/60">Medicines</div>
                      <div className="text-base font-bold text-sky-600 dark:text-sky-400">
                        {fhirResult.imported.medications}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl glass">
                      <div className="text-xs text-foreground/60">Conditions</div>
                      <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                        {fhirResult.imported.conditions}
                      </div>
                    </div>
                  </div>

                  {fhirResult.summary && (
                    <p className="text-[11px] text-foreground/75 leading-relaxed pt-1">
                      {fhirResult.summary}
                    </p>
                  )}

                  {fhirResult.skipped && fhirResult.skipped.length > 0 && (
                    <div className="text-[10px] text-foreground/50 border-t border-white/10 pt-1.5">
                      <span className="font-medium">Skipped non-clinical resources:</span>{" "}
                      {Array.from(new Set(fhirResult.skipped.map((s) => s.resourceType))).join(", ")}
                    </div>
                  )}

                  {fhirResult.warnings && fhirResult.warnings.length > 0 && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1 pt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{fhirResult.warnings.join(" ")}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Download Full Health Record (FHIR) Button - Fixed Layout */}
            <div className="pt-4 border-t border-white/20 dark:border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 max-w-sm">
                  <h3 className="text-xs font-bold text-foreground">Full Health Record (FHIR R4)</h3>
                  <p className="text-[11px] text-foreground/60 leading-relaxed">
                    Export all diagnostic, prescription, and clinical records as a consolidated ABDM-compliant FHIR R4 JSON bundle.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadFullHealthRecord}
                  disabled={exportingFhir}
                  className="glass-button text-xs !py-2.5 !px-4 flex items-center justify-center gap-1.5 shrink-0"
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
                  className="w-full px-4 py-2.5 rounded-2xl glass text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer bg-white/70 dark:bg-slate-900/70"
                >
                  <option value="" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Select option</option>
                  <option value="Male" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Male</option>
                  <option value="Female" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Female</option>
                  <option value="Non-Binary" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Non-Binary</option>
                  <option value="Prefer not to say" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Prefer not to say</option>
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
