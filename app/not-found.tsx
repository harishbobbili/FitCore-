import Link from "next/link";
import NeonButton from "@/components/ui/NeonButton";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brandBg flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-white/60 text-lg mb-8">Page not found</p>
        <Link href="/dashboard">
          <NeonButton variant="gradient">Return to Dashboard</NeonButton>
        </Link>
      </div>
    </div>
  );
}
