export default function Goals() {
  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold font-serif gradient-text">Goals ⭐</h1>
        <p className="text-muted-foreground text-sm">Manifesting that wealth 🔮</p>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-5 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✈️</span>
              <span className="font-bold text-foreground">Summer Trip</span>
            </div>
            <span className="text-sm font-bold text-primary">60%</span>
          </div>
          <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF6B9D] to-[#B06EFF] w-[60%] rounded-full"></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>$600 saved</span>
            <span>Goal: $1,000</span>
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💻</span>
              <span className="font-bold text-foreground">New Laptop</span>
            </div>
            <span className="text-sm font-bold text-primary">25%</span>
          </div>
          <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF6B9D] to-[#B06EFF] w-[25%] rounded-full"></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>$300 saved</span>
            <span>Goal: $1,200</span>
          </div>
        </div>

        <button className="w-full glass-card py-4 border-dashed border-2 border-primary/30 text-primary font-bold hover:bg-white/40 transition-colors">
          + Add New Goal ✨
        </button>
      </div>
    </div>
  );
}