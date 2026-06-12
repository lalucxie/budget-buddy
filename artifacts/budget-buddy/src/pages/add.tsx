export default function AddExpense() {
  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold font-serif gradient-text">Add Expense 💸</h1>
        <p className="text-muted-foreground text-sm">Where did the money go? ☕</p>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div className="flex justify-center mb-4">
          <div className="text-5xl gradient-text font-bold flex items-center">
            <span className="text-3xl mr-1 opacity-70">$</span>
            <input 
              type="number" 
              placeholder="0.00" 
              className="w-32 bg-transparent border-none text-center focus:outline-none placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground ml-1">Category & Emoji</label>
          <div className="flex gap-2">
            <button className="w-12 h-12 bg-white/50 border border-white/80 rounded-xl flex items-center justify-center text-xl hover:bg-white/80 transition-colors">
              🛍️
            </button>
            <input 
              type="text" 
              placeholder="e.g. Shopping" 
              className="flex-1 bg-white/50 border border-white/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground ml-1">Note (optional)</label>
          <input 
            type="text" 
            placeholder="treat yo self 💅" 
            className="w-full bg-white/50 border border-white/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all"
          />
        </div>

        <button className="w-full mt-4 gradient-btn py-4 text-lg">Add to Tracker ✨</button>
      </div>
    </div>
  );
}