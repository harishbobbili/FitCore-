"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/layout/Navigation";
import SmartReminderEngine from "@/components/layout/SmartReminderEngine";
import ChatbotDrawer from "@/components/layout/ChatbotDrawer";
import ToastContainer from "@/components/ui/ToastContainer";
import AchievementUnlockOverlay from "@/components/layout/AchievementUnlockOverlay";
import type { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/forgot-password");

  return (
    <>
      {!isAuthRoute ? <Navigation /> : null}
      <div className={isAuthRoute ? "min-h-screen" : "md:pl-64 min-h-screen flex flex-col"}>
        <main className={isAuthRoute ? "min-h-screen" : "flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto"}>{children}</main>
      </div>
      <ToastContainer />
      <AchievementUnlockOverlay />
      {!isAuthRoute ? <SmartReminderEngine /> : null}
      {!isAuthRoute ? <ChatbotDrawer /> : null}
    </>
  );
}