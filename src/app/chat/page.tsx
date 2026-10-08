"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import {
  Sparkles,
  Send,
  Bot,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

const suggestionPrompts = [
  "What does an elevated hemoglobin level mean?",
  "Can you explain what an HbA1c test measures?",
  "What questions should I ask my doctor about my lipid profile?",
  "How can I better prepare for my upcoming blood test?",
];

export default function ChatPage() {
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    toast.info("Arogya Copilot AI chat engine will be linked in the Copilot module!");
    setInput("");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="glass p-6 rounded-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Health Consultation Companion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Arogya Copilot Chat
          </h1>
          <p className="text-sm text-foreground/70 max-w-xl">
            Ask questions about your lab metrics, terminology, and test explanations. Remember, Arogya educates and organizes—it does not diagnose or prescribe.
          </p>
        </div>

        {/* Chat Conversation Card */}
        <div className="glass-strong p-6 sm:p-8 rounded-3xl min-h-[380px] flex flex-col justify-between space-y-6">
          {/* Empty State / Welcome Message */}
          <div className="space-y-6">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div className="glass p-4 rounded-2xl max-w-lg space-y-1.5 text-xs sm:text-sm text-foreground">
                <p className="font-semibold text-teal-600 dark:text-teal-400">
                  Arogya Copilot
                </p>
                <p className="text-foreground/80 leading-relaxed">
                  Hello! I am your health companion. I can help translate medical abbreviations, explain reference ranges, and help you draft thoughtful questions for your physician. How can I help you today?
                </p>
              </div>
            </div>

            {/* Prompt Chips */}
            <div className="pl-12 space-y-2">
              <p className="text-xs font-semibold text-foreground/50 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestionPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full glass hover:border-teal-500/40 text-foreground/75 hover:text-foreground text-left transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a lab marker, report summary, or health term..."
              className="flex-1 py-3 px-4 rounded-2xl glass border border-white/40 dark:border-white/10 text-foreground placeholder:text-foreground/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
            <button
              type="submit"
              className="glass-button !p-3 !rounded-2xl"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
