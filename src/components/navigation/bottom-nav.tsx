"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  MessageSquare,
  UserCheck,
} from "lucide-react";

import { useT } from "@/i18n/context";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useT();

  const mobileNavItems = [
    { name: t("nav_dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("nav_upload"), href: "/upload", icon: UploadCloud },
    { name: t("nav_chat"), href: "/chat", icon: MessageSquare },
    { name: t("nav_profile"), href: "/profile", icon: UserCheck },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-4 left-4 right-4 z-40"
    >
      <div className="glass-strong px-3 py-2 flex items-center justify-around shadow-2xl border border-white/30 dark:border-white/10 rounded-3xl">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              id={`mobile-nav-${item.name.toLowerCase()}`}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-2xl transition-all ${
                isActive
                  ? "text-teal-600 dark:text-teal-400 font-semibold"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 scale-110"
                    : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
