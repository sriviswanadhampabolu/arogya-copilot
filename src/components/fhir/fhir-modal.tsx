"use client";

import React, { useState, useMemo } from "react";
import {
  Download,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  X,
  FileCode,
  ShieldAlert,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { toast } from "sonner";
import type { FhirBundle } from "@/lib/fhir";

interface FhirModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundle: FhirBundle | Record<string, unknown> | null;
  title: string;
}

// Collapsible JSON node with syntax highlighting
function JsonNode({
  name,
  value,
  isLast,
  depth = 0,
  defaultExpanded = true,
}: {
  name?: string;
  value: unknown;
  isLast: boolean;
  depth?: number;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded && depth < 3);

  const isObject = value !== null && typeof value === "object" && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isCompound = isObject || isArray;

  const indentStyle = { paddingLeft: `${depth * 18}px` };

  if (isCompound) {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    const isEmpty = keys.length === 0;
    const openBracket = isArray ? "[" : "{";
    const closeBracket = isArray ? "]" : "}";

    return (
      <div className="font-mono text-xs leading-relaxed select-text">
        <div
          style={indentStyle}
          className="flex items-center gap-1 hover:bg-white/5 dark:hover:bg-white/5 py-0.5 rounded px-1 group cursor-pointer"
          onClick={() => !isEmpty && setExpanded(!expanded)}
        >
          {!isEmpty ? (
            <button
              type="button"
              className="w-4 h-4 flex items-center justify-center text-foreground/40 group-hover:text-foreground/80"
            >
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4 h-4 inline-block" />
          )}

          {name && (
            <span className="text-teal-600 dark:text-teal-400 font-semibold">
              &quot;{name}&quot;:{" "}
            </span>
          )}

          <span className="text-foreground/70 font-semibold">{openBracket}</span>

          {!expanded && !isEmpty && (
            <span className="text-foreground/40 text-[11px] px-1.5 py-0.2 rounded bg-white/10 mx-1">
              {isArray ? `${keys.length} items` : `${keys.length} keys`}
            </span>
          )}

          {!expanded && (
            <span className="text-foreground/70 font-semibold">
              {closeBracket}
              {!isLast ? "," : ""}
            </span>
          )}
        </div>

        {expanded && (
          <div>
            {keys.map((k, idx) => (
              <JsonNode
                key={k}
                name={isArray ? undefined : k}
                value={record[k]}
                isLast={idx === keys.length - 1}
                depth={depth + 1}
                defaultExpanded={depth < 2}
              />
            ))}
            <div style={indentStyle} className="text-foreground/70 font-semibold py-0.5 pl-5">
              {closeBracket}
              {!isLast ? "," : ""}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Primitive value rendering
  let valueDisplay = null;
  if (typeof value === "string") {
    valueDisplay = (
      <span className="text-emerald-600 dark:text-emerald-400 break-all">
        &quot;{value}&quot;
      </span>
    );
  } else if (typeof value === "number") {
    valueDisplay = <span className="text-amber-600 dark:text-amber-400">{value}</span>;
  } else if (typeof value === "boolean") {
    valueDisplay = (
      <span className="text-purple-600 dark:text-purple-400 font-bold">
        {value ? "true" : "false"}
      </span>
    );
  } else if (value === null) {
    valueDisplay = <span className="text-slate-400 italic">null</span>;
  } else {
    valueDisplay = <span className="text-foreground">{String(value)}</span>;
  }

  return (
    <div
      style={indentStyle}
      className="font-mono text-xs leading-relaxed py-0.5 px-1 hover:bg-white/5 dark:hover:bg-white/5 rounded flex items-start gap-1 select-text pl-5"
    >
      {name && (
        <span className="text-teal-600 dark:text-teal-400 font-semibold shrink-0">
          &quot;{name}&quot;:{" "}
        </span>
      )}
      <span className="break-all">{valueDisplay}</span>
      {!isLast && <span className="text-foreground/60">,</span>}
    </div>
  );
}

export function FhirModal({ isOpen, onClose, bundle, title }: FhirModalProps) {
  const [copied, setCopied] = useState(false);
  const [expandAllKey, setExpandAllKey] = useState<number>(0);
  const [isFullExpanded, setIsFullExpanded] = useState(true);

  const formattedJsonString = useMemo(() => {
    return JSON.stringify(bundle, null, 2);
  }, [bundle]);

  const bundleRecord = (bundle || {}) as Record<string, unknown>;
  const meta = bundleRecord.meta as { profile?: string[] } | undefined;
  const profileUrl = meta?.profile?.[0] || "";
  const profileName = profileUrl.split("/").pop() || "FHIR R4 Bundle";
  const bundleType = (bundleRecord.type as string) || "collection";
  const entryList = bundleRecord.entry as unknown[] | undefined;

  if (!isOpen || !bundle) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJsonString);
      setCopied(true);
      toast.success("FHIR Bundle copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy JSON");
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([formattedJsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const safeName = (title || "health_record")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_")
        .replace(/_+/g, "_");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}_fhir_bundle.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("FHIR JSON downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    }
  };

  const toggleExpandAll = () => {
    setIsFullExpanded(!isFullExpanded);
    setExpandAllKey((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] glass-strong rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/20 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 dark:bg-black/40">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                <FileCode className="w-3.5 h-3.5" />
                ABDM FHIR R4
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-foreground/70">
                Type: {bundleType}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                Profile: {profileName}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
              {title || "FHIR R4 Bundle"}
            </h2>

            {/* ABDM Demo Banner */}
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md font-medium">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Demo mode, not connected to the real ABDM</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={toggleExpandAll}
              title={isFullExpanded ? "Collapse structure" : "Expand structure"}
              className="p-2 rounded-xl glass hover:bg-white/20 dark:hover:bg-white/10 text-foreground/70 transition-colors text-xs flex items-center gap-1"
            >
              {isFullExpanded ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden md:inline">Collapse</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden md:inline">Expand</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl glass hover:bg-white/20 dark:hover:bg-white/10 text-foreground/70 transition-colors text-xs flex items-center gap-1"
              title="Copy JSON to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="glass-button text-xs !py-2 !px-3.5 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download FHIR JSON</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl glass hover:bg-red-500/10 hover:text-red-500 text-foreground/60 transition-colors ml-1"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Collapsible syntax-highlighted JSON */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950/60 dark:bg-black/80 text-foreground select-text custom-scrollbar">
          <div key={expandAllKey} className="space-y-0.5">
            <JsonNode
              value={bundle}
              isLast={true}
              depth={0}
              defaultExpanded={isFullExpanded}
            />
          </div>
        </div>

        {/* Modal Footer info */}
        <div className="px-6 py-3 border-t border-white/20 dark:border-white/10 bg-white/20 dark:bg-black/30 flex items-center justify-between text-[11px] text-foreground/60">
          <span>ABDM NRCeS R4 Specification Compliant Structure</span>
          <span>{entryList?.length || 0} Bundle Entries</span>
        </div>
      </div>
    </div>
  );
}
