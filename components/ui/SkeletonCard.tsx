import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export default function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-[shimmer_1.4s_infinite]",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 animate-pulse" />
    </div>
  );
}
