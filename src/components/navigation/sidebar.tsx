"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  MessageSquare,
  UserCheck,
  Layers,
} from "lucide-react";

export const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Upload", href: "/upload", icon: UploadCloud },
  { name: "Copilot Chat", href: "/chat", icon: MessageSquare },
  { name: "Profile", href: "/profile", icon: UserCheck },
  { name: "Architecture", href: "/architecture", icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Main Navigation"
      className="hidden md:flex flex-col w-64 glass p-4 fixed left-6 top-28 bottom-8 z-30 shadow-lg justify-between"
    >
      <div className="space-y-6">
        <div className="px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
            Health Portal
          </p>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                id={`sidebar-link-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-teal-500/20 to-sky-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 shadow-sm"
                    : "text-foreground/70 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5"
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isActive
                      ? "bg-teal-500 text-white shadow-md shadow-teal-500/30"
                      : "bg-black/5 dark:bg-white/5 group-hover:bg-teal-500/10 group-hover:text-teal-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3.5 rounded-2xl glass-strong border border-teal-500/20 text-xs space-y-1">
        <p className="font-semibold text-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Arogya Engine
        </p>
        <p className="text-foreground/60 text-[11px] leading-relaxed">
          AI-assisted lab report analysis and longitudinal tracking.
        </p>
      </div>
    </aside>
  );
}
