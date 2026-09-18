import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're offline",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-em-bg px-6">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-er-red-light flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-er-red">
            <path
              d="M12 2L2.5 7.5V16.5L12 22L21.5 16.5V7.5L12 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M12 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-em-text mb-2">You&apos;re offline</h1>
        <p className="text-sm text-em-text-muted mb-6">
          ADRIAN can&apos;t reach the network right now. Check your connection — pages
          you&apos;ve already visited may still be available.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-er-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-er-red-dark transition-colors"
        >
          Try again
        </a>
      </div>
    </div>
  );
}
