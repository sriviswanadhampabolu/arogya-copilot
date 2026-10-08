"use client";

import React, { useState, useRef, useEffect } from "react";
import { useT } from "@/i18n/context";
import { Language } from "@/i18n/translations";
import { Globe, ChevronDown, Check } from "lucide-react";

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
];

export function LanguageSwitcher() {
  const { lang, setLanguage } = useT();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        id="language-switcher-btn"
        onClick={() => setOpen(!open)}
        className="h-10 px-3 rounded-full glass flex items-center gap-1.5 text-xs font-semibold text-foreground hover:scale-105 active:scale-95 transition-all shadow-sm hover:border-teal-500/40 cursor-pointer"
        aria-label="Change Language"
      >
        <Globe className="w-4 h-4 text-teal-500 shrink-0" />
        <span className="font-bold uppercase tracking-wider">{currentLang.code}</span>
        <ChevronDown className="w-3 h-3 text-foreground/50 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-2xl glass-strong border border-white/20 dark:border-white/10 p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          {languages.map((item) => {
            const isSelected = item.code === lang;

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLanguage(item.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                  isSelected
                    ? "bg-teal-500 text-white font-bold shadow-sm"
                    : "text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <span>{item.nativeName}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
