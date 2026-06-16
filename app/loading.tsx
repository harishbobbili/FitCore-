export default function Loading() {
  return (
    <div className="min-h-screen bg-brandBg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-neonPurple/30 border-t-neonPurple rounded-full animate-spin" />
        <p className="text-white/60 text-sm font-medium">Loading FitCore...</p>
      </div>
    </div>
  );
}
