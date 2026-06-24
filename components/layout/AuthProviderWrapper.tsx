"use client";

import { AuthProvider } from "@/lib/auth/AuthProvider";

export default function AuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
