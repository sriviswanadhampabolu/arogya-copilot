"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/navigation/app-shell";
import { createClient } from "@/utils/supabase/client";
import ReactMarkdown from "react-markdown";
import { useT } from "@/i18n/context";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  UploadCloud,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

const SUGGESTED_CHIPS = [
  "Is my sugar improving?",
  "Explain my latest report",
  "What medicines am I taking and when?",
  "Which values need attention?",
  "What should I ask my doctor?",
];

export default function ChatPage() {
  const { lang, t } = useT();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [documentCount, setDocumentCount] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Load chat history & check document count
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoadingHistory(false);
          return;
        }

        // 1. Check report count
        const { count } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        setDocumentCount(count || 0);

        // 2. Fetch existing chat messages
        const { data: history } = await supabase
          .from("chat_messages")
          .select("id, role, content, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (history && history.length > 0) {
          setMessages(
            history.map((h) => ({
              id: h.id,
              role: h.role as "user" | "assistant",
              content: h.content,
              created_at: h.created_at,
            }))
          );
        } else {
          // Default initial friendly greeting
          setMessages([
            {
              id: "welcome-1",
              role: "assistant",
              content:
                "Hello! I am **Arogya**, your personal health copilot. I have access to your uploaded lab tests, prescriptions, and health records.\n\nYou can ask me to explain medical terms, check your health trends, review your medication schedule, or prepare questions for your next doctor's appointment. How can I help you today?",
            },
          ]);
        }
      } catch (err) {
        console.error("Error loading chat:", err);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadData();
  }, []);

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || input).trim();
    if (!text || isStreaming) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Add user message to UI state
    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: text },
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);

    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, lang }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body received");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        // Update assistant bubble in real-time
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulated }
              : msg
          )
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error streaming response";
      toast.error(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content:
                  "I encountered an issue retrieving that health explanation. Please try again or rephrase your question.",
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearChat = async () => {
    try {
      const response = await fetch("/api/chat", { method: "DELETE" });
      if (response.ok) {
        setMessages([
          {
            id: `welcome-${Date.now()}`,
            role: "assistant",
            content:
              "Chat history cleared. I'm ready to answer any new questions about your health records!",
          },
        ]);
        toast.success("Chat history cleared");
      } else {
        toast.error("Failed to clear chat history");
      }
    } catch {
      toast.error("Network error clearing chat");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppShell>
      <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-180px)] min-h-[550px]">
        {/* Top Header Card */}
        <div className="glass px-5 py-3.5 rounded-3xl flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-400 text-white flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-foreground">
                  Arogya Copilot
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-foreground/60 hidden sm:block">
                Trained on your private health records & general wellness knowledge
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass hover:bg-rose-500/10 hover:text-rose-600 transition-colors text-xs text-foreground/60"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("btn_clear_chat")}</span>
          </button>

        </div>

        {/* Prompt to upload documents if none exist */}
        {documentCount === 0 && (
          <div className="p-4 rounded-2xl glass-strong border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                You haven&apos;t uploaded any health records yet. Upload a report so Arogya can answer with your personalized context!
              </span>
            </div>
            <Link
              href="/upload"
              className="glass-button text-xs !py-1.5 !px-3 shrink-0 flex items-center gap-1"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Report</span>
            </Link>
          </div>
        )}

        {/* Suggested Question Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-foreground/45 shrink-0 pl-1 pr-1 font-semibold">
            <Sparkles className="w-3 h-3 text-teal-500" />
            <span>Suggestions:</span>
          </div>
          {SUGGESTED_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isStreaming}
              onClick={() => handleSend(chip)}
              className="text-xs px-3 py-1.5 rounded-full glass hover:border-teal-500/50 hover:bg-teal-500/10 text-foreground/75 hover:text-foreground shrink-0 transition-all text-left"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Main Chat Conversation Scroll Area */}
        <div className="glass-strong p-4 sm:p-6 rounded-3xl flex-1 overflow-y-auto space-y-4 border border-white/40 dark:border-white/10 shadow-inner">
          {loadingHistory ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isUser = msg.role === "user";

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm text-xs font-bold ${
                        isUser
                          ? "bg-gradient-to-tr from-teal-500 to-emerald-500"
                          : "bg-gradient-to-tr from-sky-500 to-violet-500"
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                        isUser
                          ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-tr-sm"
                          : "glass-strong border border-white/30 dark:border-white/10 text-foreground rounded-tl-sm prose dark:prose-invert prose-sm"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : msg.content ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        /* Typing indicator for streaming */
                        <div className="flex items-center gap-1.5 py-1">
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Floating Input Area */}
        <div className="space-y-2 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="glass-strong p-2 sm:p-2.5 rounded-3xl border border-white/40 dark:border-white/10 shadow-xl flex items-end gap-2"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your lab tests, medicines, or health questions..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/45 focus:outline-none resize-none max-h-32"
            />

            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="glass-button !p-3 !rounded-2xl shrink-0 shadow-md"
              aria-label="Send Message"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Emergency & Medical Disclaimer */}
          <p className="text-[11px] text-center text-foreground/50 leading-tight px-4">
            {t("disclaimer_chat")}
          </p>

        </div>
      </div>
    </AppShell>
  );
}
