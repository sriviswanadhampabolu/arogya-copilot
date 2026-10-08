"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import {
  UploadCloud,
  FileCheck,
  FileText,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      toast.success(`Selected: ${e.target.files[0].name}`);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="glass p-6 sm:p-8 rounded-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Document Extraction Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Upload Diagnostic Report
          </h1>
          <p className="text-sm text-foreground/70 max-w-xl">
            Upload blood work, lipid profiles, metabolic panels, or pathology summaries. Arogya organizes the markers and extracts reference values.
          </p>
        </div>

        {/* Upload Dropzone */}
        <div className="glass-strong p-8 sm:p-12 rounded-3xl border-2 border-dashed border-teal-500/30 text-center space-y-4 hover:border-teal-500/60 transition-colors">
          <div className="w-16 h-16 rounded-3xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {selectedFile ? selectedFile.name : "Drag & drop your lab report here"}
            </h3>
            <p className="text-xs text-foreground/60">
              Supports PDF, PNG, JPG, or JPEG up to 15MB
            </p>
          </div>

          <div className="pt-2">
            <label
              htmlFor="report-file-input"
              className="glass-button text-xs sm:text-sm !py-2.5 !px-6 cursor-pointer inline-flex"
            >
              <FileCheck className="w-4 h-4" />
              <span>{selectedFile ? "Change File" : "Browse Files"}</span>
              <input
                id="report-file-input"
                type="file"
                accept=".pdf,image/png,image/jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {selectedFile && (
            <div className="pt-4 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => toast.info("Report ingestion pipeline will process this document in Module 2.")}
                className="glass-button w-full !py-2.5 text-xs font-semibold"
              >
                <span>Process with Gemini AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Security and Processing Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass p-5 rounded-3xl flex items-start gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">Encrypted Storage</h4>
              <p className="text-xs text-foreground/60 leading-relaxed">
                Reports are stored in your private Supabase storage bucket with user-isolated access controls.
              </p>
            </div>
          </div>

          <div className="glass p-5 rounded-3xl flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">Structured Lab Values</h4>
              <p className="text-xs text-foreground/60 leading-relaxed">
                Biomarkers are automatically extracted, standardized, and charted across your timeline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
