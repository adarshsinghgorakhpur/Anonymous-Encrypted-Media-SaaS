export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-white/[0.06] rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/[0.04] rounded-2xl" />
        ))}
      </div>
      <div className="h-32 bg-white/[0.04] rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-48 bg-white/[0.04] rounded-2xl" />
        <div className="h-48 bg-white/[0.04] rounded-2xl" />
      </div>
    </div>
  );
}
