export default function Setup() {
  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold font-serif gradient-text">Setup 👤</h1>
        <p className="text-muted-foreground text-sm">Tell us about your money goals ✨</p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground ml-1">What's your name?</label>
          <input 
            type="text" 
            placeholder="e.g. bestie" 
            className="w-full bg-white/50 border-white/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground ml-1">Monthly Budget</label>
          <input 
            type="number" 
            placeholder="$0.00" 
            className="w-full bg-white/50 border-white/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all"
          />
        </div>
        <button className="w-full mt-4 gradient-btn py-3">Save & Slay 💅</button>
      </div>
    </div>
  );
}