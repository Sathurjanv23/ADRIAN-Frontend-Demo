export default function Loading() {
  return (
    <div className="min-h-screen bg-em-bg flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative w-16 h-16">
        {/* Spinning ring */}
        <div className="w-16 h-16 rounded-full border-4 border-em-muted border-t-er-red animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-er-red">
          🛡️
        </div>
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-black text-em-text uppercase tracking-widest animate-pulse">
          ADRIAN
        </p>
        <p className="text-xs text-em-text-muted font-semibold">Loading Emergency Response Interface...</p>
      </div>
    </div>
  );
}
