export default function Pet() {
  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold font-serif gradient-text">Your Pet 🐾</h1>
        <p className="text-muted-foreground text-sm">Keep them happy by saving! 💕</p>
      </div>

      <div className="glass-card p-8 flex flex-col items-center text-center space-y-6">
        <div className="w-48 h-48 bg-white/40 rounded-full border-4 border-white flex items-center justify-center shadow-[0_0_50px_rgba(255,107,157,0.2)] float">
          <span className="text-8xl">🐰</span>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-serif text-foreground">Boba</h2>
          <span className="chrome-badge px-3 py-1 bg-white/80">Mood: Very Happy ✨</span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed px-4">
          Boba is thriving because you stayed under budget this week! Keep it up bestie! 💅
        </p>
      </div>
    </div>
  );
}