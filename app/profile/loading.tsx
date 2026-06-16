export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-brandBg p-6">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-32 bg-white/10 rounded animate-pulse mb-8" />
        <div className="space-y-6">
          <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
          <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
