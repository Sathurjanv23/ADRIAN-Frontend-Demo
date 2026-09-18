export default function CommandLoading() {
  return (
    <div className="min-h-screen bg-em-bg p-6 space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-14 bg-white rounded-2xl border border-em-border" />

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-em-border p-4 space-y-3">
            <div className="w-1/3 h-3 bg-em-subtle rounded" />
            <div className="w-1/2 h-7 bg-em-subtle rounded" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-em-border p-5 space-y-4">
          <div className="w-1/4 h-4 bg-em-subtle rounded" />
          <div className="w-full h-72 bg-em-subtle/50 rounded-xl" />
        </div>
        <div className="h-96 bg-white rounded-2xl border border-em-border p-5 space-y-4">
          <div className="w-1/3 h-4 bg-em-subtle rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-em-subtle/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
