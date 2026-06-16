import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { isSupabaseReady, validateEnv } from "@/lib/env";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "FitCore — AI Fitness Coach & Workout Tracker",
  description:
    "Advanced fitness analytics, personalized workout sessions, AI nutrition coaching, and progress tracking for serious gym-goers. Build muscle, lose fat, and achieve your fitness goals with data-driven insights.",
  keywords: ["fitness", "workout tracker", "AI coach", "gym", "bodybuilding", "nutrition", "progress tracking", "analytics"],
  authors: [{ name: "FitCore" }],
  creator: "FitCore",
  publisher: "FitCore",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://fitcore.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "FitCore — AI Fitness Coach & Workout Tracker",
    description: "Advanced fitness analytics, personalized workout sessions, AI nutrition coaching, and progress tracking for serious gym-goers.",
    siteName: "FitCore",
  },
  twitter: {
    card: "summary_large_image",
    title: "FitCore — AI Fitness Coach & Workout Tracker",
    description: "Advanced fitness analytics, personalized workout sessions, AI nutrition coaching, and progress tracking for serious gym-goers.",
    creator: "@fitcore",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

// Log env warnings at server startup (dev only)
if (process.env.NODE_ENV === "development") {
  const { warnings, errors } = validateEnv();
  if (warnings.length) console.warn("[FitCore] Env warnings:", warnings);
  if (errors.length) console.error("[FitCore] Env errors:", errors);
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const showMockBanner = !isSupabaseReady() && process.env.NODE_ENV === "development";

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-brandBg text-white/80 min-h-screen relative`}
      >
        {showMockBanner && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-500/10 border-b border-yellow-500/30 text-yellow-200 text-xs text-center py-2 z-50">
            ⚠️ Running in demo mode — Supabase not configured. See{" "}
            <a href="/README.md" className="underline">
              README
            </a>{" "}
            for setup.
          </div>
        )}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
