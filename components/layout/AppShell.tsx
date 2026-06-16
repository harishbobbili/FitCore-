"use client";

import { usePathname } from "next/navigation";
import { lazy, Suspense } from "react";
import ToastContainer from "@/components/ui/ToastContainer";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import type { ReactNode } from "react";

// Lazy load heavy layout components
const Navigation = lazy(() => import("@/components/layout/Navigation"));
const SmartReminderEngine = lazy(() => import("@/components/layout/SmartReminderEngine"));
const ChatbotDrawer = lazy(() => import("@/components/layout/ChatbotDrawer"));
const AchievementUnlockOverlay = lazy(() => import("@/components/layout/AchievementUnlockOverlay"));

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/forgot-password");

  return (
    <AuthProvider>
      <>
        {!isAuthRoute ? (
          <Suspense fallback={null}>
            <Navigation />
          </Suspense>
        ) : null}
        <div className={isAuthRoute ? "min-h-screen" : "md:pl-64 min-h-screen flex flex-col"}>
          <main className={isAuthRoute ? "min-h-screen" : "flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto"}>{children}</main>
        </div>
        <ToastContainer />
        <Suspense fallback={null}>
          <AchievementUnlockOverlay />
        </Suspense>
        {!isAuthRoute ? (
          <Suspense fallback={null}>
            <SmartReminderEngine />
          </Suspense>
        ) : null}
        {!isAuthRoute ? (
          <Suspense fallback={null}>
            <ChatbotDrawer />
          </Suspense>
        ) : null}
      </>
    </AuthProvider>
  );
}