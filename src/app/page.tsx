"use client";

import React from "react";
import Link from "next/link";
import { TopBar } from "@/components/navigation/top-bar";
import { HealthcareDisclaimer } from "@/components/disclaimer";
import {
  FileText,
  FolderHeart,
  Bot,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HeartPulse,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

const featureCards = [
  {
    title: "Understand",
    description:
      "Transform cryptic lab markers and blood reports into clear, empathetic, and patient-friendly explanations.",
    icon: FileText,
    accent: "from-teal-500 to-emerald-400",
    badge: "Plain Language",
  },
  {
    title: "Organize",
    description:
      "Keep all your diagnostics, scans, and timelines organized in one secure place with chronological trend insights.",
    icon: FolderHeart,
    accent: "from-sky-500 to-cyan-400",
    badge: "Smart Tracking",
  },
  {
    title: "Manage",
    description:
      "Collaborate with your AI Copilot to prepare informed questions for your next doctor's appointment.",
    icon: Bot,
    accent: "from-violet-500 to-indigo-400",
    badge: "Doctor-Ready",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <TopBar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center justify-center text-center">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-teal-500/30 text-xs sm:text-sm font-medium text-teal-700 dark:text-teal-300 shadow-sm mb-6"
        >
          <Sparkles className="w-4 h-4 text-teal-500" />
          <span>Next-Generation Patient Health Intelligence</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.15]"
        >
          <span className="bg-gradient-to-r from-teal-600 via-sky-600 to-violet-600 dark:from-teal-300 dark:via-sky-300 dark:to-violet-400 bg-clip-text text-transparent">
            Arogya Copilot
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg sm:text-2xl md:text-3xl font-medium text-foreground/80 max-w-2xl leading-snug"
        >
          Understand your reports. Organize your health. Manage it with AI.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link
            href="/signup"
            id="hero-signup-btn"
            className="glass-button w-full sm:w-auto text-base !px-8 !py-3.5 shadow-lg group"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            id="hero-login-btn"
            className="glass-button-secondary w-full sm:w-auto text-base !px-8 !py-3.5"
          >
            Log In to Your Portal
          </Link>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left"
        >
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="glass p-7 rounded-3xl hover:-translate-y-1.5 transition-all duration-300 relative group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${card.accent} flex items-center justify-center text-white shadow-md`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full glass border border-white/30 dark:border-white/10 text-foreground/70">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground tracking-tight">
                    {card.title}
                  </h3>

                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-black/5 dark:border-white/5 flex items-center text-xs font-semibold text-teal-600 dark:text-teal-400 group-hover:gap-1.5 transition-all">
                  <span>Explore {card.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Security and Trust highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-foreground/60"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-500" />
            <span>Private & Encrypted Health Records</span>
          </div>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <span>Patient-Empowering Insights</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-500" />
            <span>Longitudinal Biomarker Tracking</span>
          </div>
        </motion.div>
      </main>

      {/* Footer with Disclaimer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-8 pt-4">
        <HealthcareDisclaimer />
        <p className="text-center text-xs text-foreground/50 mt-4">
          © {new Date().getFullYear()} Arogya Copilot. Designed for health literacy and diagnostic clarity.
        </p>
      </footer>
    </div>
  );
}
