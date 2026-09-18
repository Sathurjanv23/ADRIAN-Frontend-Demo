export default function CitizenLoading() {
  return (
    <div className="min-h-screen bg-em-bg p-4 max-w-xl mx-auto space-y-6 animate-pulse">
      <div className="h-12 bg-white rounded-2xl border border-em-border" />
      <div className="h-32 bg-white rounded-2xl border border-em-border" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-em-border" />
        ))}
      </div>
      <div className="h-44 bg-white rounded-2xl border border-em-border" />
    </div>
  );
}
