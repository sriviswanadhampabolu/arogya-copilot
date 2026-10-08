"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { useT } from "@/i18n/context";

export function HealthcareDisclaimer({ className = "" }: { className?: string }) {
  const { t } = useT();

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
        {t("disclaimer_medical")}
      </p>
    </div>
  );
}

