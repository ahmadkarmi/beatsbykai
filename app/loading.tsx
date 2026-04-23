export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-28 lg:hidden">
      {/* Hero skeleton */}
      <div className="w-full bg-surface-2 animate-pulse" style={{ aspectRatio: "1/1" }} />
      {/* Metadata row */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="space-y-2">
          <div className="h-2.5 w-16 bg-surface-2 rounded animate-pulse" />
          <div className="h-2 w-12 bg-surface-2 rounded animate-pulse" />
        </div>
        <div className="w-14 h-14 rounded-full bg-surface-2 animate-pulse" />
      </div>
      {/* Track rows */}
      <div className="px-5 py-3">
        <div className="h-3 w-16 bg-surface-2 rounded animate-pulse mb-4" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3 border-l-2 border-transparent">
          <div className="w-12 h-12 bg-surface-2 rounded-sm animate-pulse flex-shrink-0" style={{ animationDelay: `${i * 0.05}s` }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-surface-2 rounded animate-pulse w-2/3" style={{ animationDelay: `${i * 0.05}s` }} />
            <div className="h-2 bg-surface-2 rounded animate-pulse w-1/2" style={{ animationDelay: `${i * 0.05}s` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
