import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-muted/30 mb-4">404</p>
      <h1 className="text-3xl font-bold text-text tracking-tight mb-2">Page not found</h1>
      <p className="text-sm text-muted/50 mb-8 max-w-xs">
        This track doesn&apos;t exist or has been removed from the library.
      </p>
      <Link
        href="/"
        className="text-xs font-bold uppercase tracking-[0.2em] text-accent hover:text-accent-hover transition-colors"
      >
        ← Back to Library
      </Link>
    </div>
  );
}
