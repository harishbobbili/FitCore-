export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-brandBg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="h-8 w-64 bg-white/10 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
