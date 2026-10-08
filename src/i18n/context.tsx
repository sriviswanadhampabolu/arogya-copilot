"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, translations, Translations } from "./translations";
import { createClient } from "@/utils/supabase/client";

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
  dictionary: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLanguage: () => {},
  t: (key) => translations.en[key] || "",
  dictionary: translations.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    // 1. Try reading from localStorage

    const saved = localStorage.getItem("arogya_lang") as Language;
    if (saved && (saved === "en" || saved === "te" || saved === "hi")) {
      setLangState(saved);
      document.documentElement.lang = saved;
      document.body.setAttribute("data-lang", saved);
    }

    // 2. Sync from Supabase profile if authenticated
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from("profiles")
            .select("preferred_language")
            .eq("id", user.id)
            .single()
            .then(({ data }) => {
              if (data?.preferred_language) {
                const profileLang = data.preferred_language as Language;
                if (profileLang === "en" || profileLang === "te" || profileLang === "hi") {
                  setLangState(profileLang);
                  localStorage.setItem("arogya_lang", profileLang);
                  document.documentElement.lang = profileLang;
                  document.body.setAttribute("data-lang", profileLang);
                }
              }
            });
        }
      });
    } catch {
      // Continue
    }
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("arogya_lang", newLang);
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLang;
      document.body.setAttribute("data-lang", newLang);
    }

    // Update profile in background if logged in
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("profiles")
          .update({ preferred_language: newLang })
          .eq("id", user.id);
      }
    } catch (err) {
      console.warn("Could not persist language to profile:", err);
    }
  };

  const currentDict = translations[lang] || translations.en;

  const t = (key: keyof Translations): string => {
    return currentDict[key] || translations.en[key] || String(key);
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLanguage,
        t,
        dictionary: currentDict,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext);
}
