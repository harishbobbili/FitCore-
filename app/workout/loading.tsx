export default function WorkoutLoading() {
  return (
    <div className="min-h-screen bg-brandBg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 gap-6">
          <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
