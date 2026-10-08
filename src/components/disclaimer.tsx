import React from "react";
import { AlertCircle } from "lucide-react";

export function HealthcareDisclaimer({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label="Medical Disclaimer"
      className={`glass-strong border border-amber-500/30 px-4 py-3 rounded-2xl flex items-start sm:items-center gap-3 text-xs sm:text-sm text-foreground/85 shadow-sm ${className}`}
    >
      <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
        <AlertCircle className="w-4 h-4" />
      </div>
      <p className="leading-relaxed">
        <strong className="font-semibold text-foreground">Medical Disclaimer:</strong> Arogya Copilot is an AI health organizer and educational companion. It does not provide medical diagnoses, treatment decisions, or prescriptions. Always seek guidance from a qualified healthcare professional for medical concerns.
      </p>
    </div>
  );
}
