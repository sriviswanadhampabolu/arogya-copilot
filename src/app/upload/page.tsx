"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/navigation/app-shell";
import { createClient } from "@/utils/supabase/client";
import {
  UploadCloud,
  FileText,
  FileCheck,
  X,
  Camera,
  Loader2,
  Sparkles,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface SelectedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: "idle" | "uploading" | "analyzing" | "completed" | "error";
  currentStep?: number;
  reportId?: string;
  errorMessage?: string;
}

const PIPELINE_STEPS = [
  "Uploading to secure vault",
  "Reading the document (OCR)",
  "Extracting medicines, tests and diagnoses",
  "Writing your simple summary",
];

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<SelectedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setGlobalError(null);

    const validFiles: SelectedFileItem[] = [];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

    Array.from(fileList).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported format. Please use PDF, JPG, or PNG.`);
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`"${file.name}" exceeds the 10MB size limit.`);
        return;
      }
      validFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "idle",
        currentStep: 0,
      });
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      toast.success(`Added ${validFiles.length} file${validFiles.length > 1 ? "s" : ""}`);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleAddFiles(e.dataTransfer.files);
  }, []);

  const removeFile = (id: string) => {
    if (isProcessing) return;
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const processSingleFile = async (
    item: SelectedFileItem,
    index: number,
    userId: string
  ): Promise<string | null> => {
    setActiveFileIndex(index);

    const updateFileState = (patch: Partial<SelectedFileItem>) => {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, ...patch } : f))
      );
    };

    try {
      // Step 0: Uploading
      updateFileState({ status: "uploading", currentStep: 0 });
      const supabase = createClient();
      const timestamp = Date.now();
      const sanitizedName = item.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `${userId}/${timestamp}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(storagePath, item.file, {
          contentType: item.type,
          upsert: true,
        });

      if (uploadError) {
        const err = new Error(uploadError.message);
        (err as unknown as { stage: string }).stage = "storage upload";
        throw err;
      }

      // Step 1: Reading document (OCR)
      updateFileState({ status: "analyzing", currentStep: 1 });

      // Simulate slight visual step progression while waiting for the Gemini API
      const stepTimer1 = setTimeout(() => {
        updateFileState({ currentStep: 2 });
      }, 4000);

      const stepTimer2 = setTimeout(() => {
        updateFileState({ currentStep: 3 });
      }, 9000);

      // Call server route /api/reports/analyze
      const response = await fetch("/api/reports/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: storagePath,
          fileName: item.name,
          fileType: item.type,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      let data: { success?: boolean; stage?: string; error?: string; reportId?: string };
      try {
        data = await response.json();
      } catch {
        const err = new Error("Failed to parse response from server");
        (err as unknown as { stage: string }).stage = "download file";
        throw err;
      }

      if (!response.ok || !data.success) {
        const err = new Error(data.error || "Analysis failed");
        (err as unknown as { stage: string }).stage = data.stage || "Gemini call";
        throw err;
      }

      updateFileState({
        status: "completed",
        currentStep: 4,
        reportId: data.reportId,
      });

      return data.reportId || null;
    } catch (err: unknown) {
      const stage = (err as { stage?: string })?.stage || "storage upload";
      const rawMsg = err instanceof Error ? err.message : "Processing failed";
      const formattedError = `[${stage}] ${rawMsg}`;
      console.error(`[Upload Error: ${stage}]`, err);
      updateFileState({
        status: "error",
        errorMessage: formattedError,
      });
      toast.error(formattedError);
      return null;
    }
  };

  const handleStartProcessing = async () => {
    if (files.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setGlobalError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to upload reports.");
        router.push("/login");
        return;
      }

      const completedIds: string[] = [];

      for (let i = 0; i < files.length; i++) {
        // Skip already completed files if retrying
        if (files[i].status === "completed" && files[i].reportId) {
          completedIds.push(files[i].reportId!);
          continue;
        }

        const reportId = await processSingleFile(files[i], i, user.id);
        if (reportId) {
          completedIds.push(reportId);
        }
      }

      setIsProcessing(false);

      if (completedIds.length === 1 && files.length === 1) {
        toast.success("Document analyzed successfully!");
        router.push(`/reports/${completedIds[0]}`);
      } else if (completedIds.length > 0) {
        toast.success(`Processed ${completedIds.length} of ${files.length} documents!`);
        router.push("/dashboard");
      } else {
        const failedFile = files.find((f) => f.status === "error" || f.errorMessage);
        const errMsg = failedFile?.errorMessage || "Failed to process the documents. Please retry.";
        setGlobalError(errMsg);
      }
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : "An error occurred during upload";
      setGlobalError(msg);
      toast.error(msg);
    }
  };

  const hasErrors = files.some((f) => f.status === "error");

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="glass p-6 sm:p-8 rounded-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multimodal Health Ingestion Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Upload Health Document
          </h1>
          <p className="text-sm text-foreground/70 max-w-xl">
            Upload a prescription, lab report, discharge summary or scan. Arogya extracts clinical data, explains reference ranges, and organizes medications.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`glass-strong p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all text-center space-y-4 ${
            isDragging
              ? "border-teal-500 bg-teal-500/10 scale-[1.01]"
              : "border-teal-500/30 hover:border-teal-500/60"
          }`}
        >
          <div className="w-16 h-16 rounded-3xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Drag & drop files or choose from your device
            </h3>
            <p className="text-xs sm:text-sm text-foreground/60 max-w-md mx-auto">
              Upload a prescription, lab report, discharge summary or scan
            </p>
            <p className="text-[11px] text-foreground/50">
              Supports PDF, PNG, JPG, or JPEG up to 10MB per file
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="glass-button text-xs sm:text-sm !py-2.5 !px-5"
            >
              <FileCheck className="w-4 h-4" />
              <span>Browse Documents</span>
            </button>

            {/* Mobile Camera Capture */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => cameraInputRef.current?.click()}
              className="glass-button-secondary text-xs sm:text-sm !py-2.5 !px-5"
            >
              <Camera className="w-4 h-4 text-sky-500" />
              <span>Take Photo</span>
            </button>

            {/* Hidden Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,image/png,image/jpeg,image/jpg"
              onChange={(e) => handleAddFiles(e.target.files)}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleAddFiles(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Selected Files List & Preview Chips */}
        {files.length > 0 && (
          <div className="glass p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Selected Documents ({files.length})
              </h3>
              {!isProcessing && (
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {files.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl glass-strong border transition-all flex items-center justify-between ${
                    item.status === "error"
                      ? "border-rose-500/40 bg-rose-500/5"
                      : item.status === "completed"
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : idx === activeFileIndex && isProcessing
                      ? "border-teal-500/60 shadow-md shadow-teal-500/10"
                      : "border-white/30 dark:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-foreground truncate max-w-[180px] sm:max-w-[190px]">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-foreground/55">
                        {formatFileSize(item.size)} • {item.type.split("/")[1]?.toUpperCase() || "DOC"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === "completed" && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                    {item.status === "error" && (
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    )}
                    {(item.status === "uploading" || item.status === "analyzing") && (
                      <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                    )}
                    {item.status === "idle" && !isProcessing && (
                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
                        className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-foreground/40 hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Step Progress Display during processing */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-4 border-t border-black/5 dark:border-white/10 space-y-4"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                      Processing file {activeFileIndex + 1} of {files.length}:{" "}
                      <span className="text-foreground">{files[activeFileIndex]?.name}</span>
                    </span>
                    <span className="text-foreground/50">
                      Step {(files[activeFileIndex]?.currentStep ?? 0) + 1} of 4
                    </span>
                  </div>

                  {/* Steps Progress Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PIPELINE_STEPS.map((stepName, stepIndex) => {
                      const cur = files[activeFileIndex]?.currentStep ?? 0;
                      const isDone = cur > stepIndex;
                      const isCurrent = cur === stepIndex;

                      return (
                        <div
                          key={stepName}
                          className={`p-3 rounded-2xl glass text-xs flex items-center gap-2.5 transition-all ${
                            isDone
                              ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-medium"
                              : isCurrent
                              ? "border-teal-500/60 bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold"
                              : "text-foreground/40 opacity-70"
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : isCurrent ? (
                            <Loader2 className="w-4 h-4 animate-spin text-teal-500 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-foreground/30 flex items-center justify-center text-[10px] shrink-0">
                              {stepIndex + 1}
                            </div>
                          )}
                          <span className="truncate">{stepName}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error & Retry Display */}
            {globalError && (
              <div className="p-4 rounded-2xl glass-strong border border-rose-500/40 bg-rose-500/10 text-xs text-rose-700 dark:text-rose-400 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{globalError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleStartProcessing}
                  className="glass-button !py-1.5 !px-3 text-xs !bg-rose-500 text-white flex items-center gap-1 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            )}

            {/* Submit / Process Button */}
            {!isProcessing && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartProcessing}
                  id="process-reports-btn"
                  className="glass-button text-xs sm:text-sm !py-3 !px-6 shadow-lg"
                >
                  {hasErrors ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Retry Analysis</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Analyze {files.length} Document{files.length > 1 ? "s" : ""} with AI
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
