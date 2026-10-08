"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/context";
import { createClient } from "@/utils/supabase/client";
import { Activity, LogOut, User as UserIcon, Shield, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useT();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only attempt if supabase env vars are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user);
        setLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      setMenuOpen(false);
      router.push("/login");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign out";
      toast.error(message);
    }
  };

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <header className="sticky top-4 z-40 px-4 sm:px-6 w-full max-w-7xl mx-auto">
      <div className="glass px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-teal-500/25 group-hover:scale-105 transition-transform duration-200">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-teal-600 via-sky-600 to-violet-600 dark:from-teal-400 dark:via-sky-400 dark:to-violet-400 bg-clip-text text-transparent">
                Arogya
              </span>
              <span className="text-xs uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold border border-teal-500/20">
                Copilot
              </span>
            </div>
            <p className="text-[10px] text-foreground/60 hidden sm:block">AI Health Companion</p>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <ThemeToggle />

          {!loading && (
            <>
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    id="user-menu-btn"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full glass hover:border-teal-500/40 transition-all text-sm font-medium"
                    aria-label="Open user menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold uppercase">
                      {user.email?.[0] || "U"}
                    </div>
                    <span className="hidden md:inline-block max-w-[120px] truncate text-xs text-foreground/80">
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-foreground/60" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-strong border border-white/20 dark:border-white/10 p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-black/5 dark:border-white/10 mb-1">
                        <p className="text-xs font-medium text-foreground truncate">
                          {user.user_metadata?.full_name || "Patient Profile"}
                        </p>
                        <p className="text-[11px] text-foreground/60 truncate">{user.email}</p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-teal-500/10 text-foreground transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-teal-500" />
                        {t("nav_my_profile")}
                      </Link>

                      <Link
                        href="/architecture"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-teal-500/10 text-foreground transition-colors"
                      >
                        <Shield className="w-4 h-4 text-sky-500" />
                        {t("nav_architecture")}
                      </Link>

                      <div className="border-t border-black/5 dark:border-white/10 my-1" />

                      <button
                        onClick={handleLogout}
                        id="logout-button"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 transition-colors font-medium text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        {t("nav_sign_out")}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                !isAuthPage && (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      id="nav-login-btn"
                      className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-full hover:bg-teal-500/10 transition-colors text-foreground"
                    >
                      {t("nav_login")}
                    </Link>
                    <Link
                      href="/signup"
                      id="nav-signup-btn"
                      className="glass-button text-xs sm:text-sm !py-2 !px-4"
                    >
                      {t("nav_get_started")}
                    </Link>
                  </div>
                )
              )}
            </>
          )}
        </div>

      </div>
    </header>
  );
}
