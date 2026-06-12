export default function Dashboard() {
  return (
    <div className="p-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Hi Bestie 👋</h1>
          <p className="text-muted-foreground text-sm">ready to secure the bag?</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/60 border-2 border-white flex items-center justify-center text-xl shadow-sm">
          💅
        </div>
      </div>

      <div className="glass-card p-6 flex flex-col items-center justify-center space-y-2 mb-6">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.5)" strokeWidth="12" fill="none" />
            <circle cx="80" cy="80" r="70" stroke="url(#gradient)" strokeWidth="12" fill="none" strokeDasharray="440" strokeDashoffset="100" strokeLinecap="round" className="animate-in fade-in duration-1000" />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF6B9D" />
                <stop offset="100%" stopColor="#B06EFF" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-sm font-semibold text-muted-foreground">left to spend</span>
            <span className="text-2xl font-bold gradient-text">$450</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold font-serif text-foreground px-1">Recent Expenses 💸</h2>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                  ☕
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Coffee</p>
                  <p className="text-xs text-muted-foreground">Today, 9:41 AM</p>
                </div>
              </div>
              <span className="font-bold text-foreground">-$5.50</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}