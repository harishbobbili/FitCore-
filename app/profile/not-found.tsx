import Link from "next/link";
import NeonButton from "@/components/ui/NeonButton";

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-brandBg flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Profile Not Found</h1>
        <p className="text-white/60 text-lg mb-8">The profile page you're looking for doesn't exist.</p>
        <Link href="/dashboard">
          <NeonButton variant="gradient">Go to Dashboard</NeonButton>
        </Link>
      </div>
    </div>
  );
}
