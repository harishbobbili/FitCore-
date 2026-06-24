import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-white/5", className)} />;
}

export function SkeletonText({ className }: { className?: string }) {
  return <div className={cn("h-3 animate-pulse rounded-full bg-white/5", className)} />;
}

export function SkeletonCircle({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-full bg-white/5", className)} />;
}