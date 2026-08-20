export function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-emerald-500/4 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[40%] right-[10%] w-96 h-96 bg-teal-500/4 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />
      <div className="absolute bottom-[15%] left-[30%] w-64 h-64 bg-emerald-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-[60%] left-[60%] w-48 h-48 bg-amber-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '15s' }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
    </div>
  );
}
