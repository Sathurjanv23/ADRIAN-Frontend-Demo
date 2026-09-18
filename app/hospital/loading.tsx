export default function HospitalLoading() {
  return (
    <div className="min-h-screen bg-em-bg p-6 space-y-6 animate-pulse">
      <div className="h-14 bg-white rounded-2xl border border-em-border" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-em-border" />
        ))}
      </div>
      <div className="h-96 bg-white rounded-2xl border border-em-border" />
    </div>
  );
}
