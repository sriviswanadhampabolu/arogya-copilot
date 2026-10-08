import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Telugu, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/i18n/context";
import { BackgroundMesh } from "@/components/background-mesh";
import { Toaster } from "sonner";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const notoSansTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-telugu",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arogya Copilot | Smart Health Organizer & AI Companion",
  description: "Understand your lab reports, organize your health data, and manage your wellness with Arogya Copilot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${notoSansTelugu.variable} ${notoSansDevanagari.variable} font-sans antialiased relative min-h-screen selection:bg-teal-500/20 selection:text-teal-700 dark:selection:text-teal-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <LanguageProvider>
            <BackgroundMesh />
            <div className="relative z-10 min-h-screen flex flex-col">
              {children}
            </div>
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                className: "glass-strong !border-white/30 dark:!border-white/10 !text-foreground !rounded-2xl",
              }}
            />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
