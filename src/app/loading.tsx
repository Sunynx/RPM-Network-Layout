export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 rounded-lg skeleton-pulse" />
          <div className="h-4 w-32 rounded-lg skeleton-pulse mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-xl skeleton-pulse" />
          <div className="h-9 w-24 rounded-xl skeleton-pulse" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl skeleton-pulse" />
              <div className="flex-1">
                <div className="h-3 w-16 rounded skeleton-pulse" />
                <div className="h-6 w-12 rounded skeleton-pulse mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="glass-card p-6">
        <div className="h-5 w-32 rounded skeleton-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg skeleton-pulse" />
              <div className="h-4 flex-1 rounded skeleton-pulse" />
              <div className="h-4 w-24 rounded skeleton-pulse" />
              <div className="h-4 w-16 rounded skeleton-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
