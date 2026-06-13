import React from "react";

const MOCK_GOALS = [
  { id: 1, emoji: "🎧", name: "Headphones", saved: 400, target: 800 },
  { id: 2, emoji: "✈️", name: "Trip to Goa", saved: 1200, target: 5000 },
  { id: 3, emoji: "💻", name: "Laptop", saved: 8000, target: 40000 },
  { id: 4, emoji: "👟", name: "Sneakers", saved: 600, target: 3000 },
];

const MOCK_SCORES = {
  budgetControl: 72,
  savingsHabit: 55,
  impulseControl: 88,
  overall: 72,
};

const FROSTED_STYLE = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(16px)",
  border: "1.5px solid rgba(255,255,255,0.7)",
};

const GRADIENT_TEXT = {
  background: "linear-gradient(135deg, #FF6B9D, #B06EFF)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const GRADIENT_BG = {
  background: "linear-gradient(135deg, #FF6B9D, #B06EFF)",
};

const GRADIENT_BTN = {
  ...GRADIENT_BG,
  color: "white",
  borderRadius: "9999px",
};

export function DashboardGrid() {
  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8 font-sans"
      style={{
        background: "linear-gradient(135deg, #E8D5F5 0%, #FFD6E7 100%)",
      }}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-pink-600/80 font-medium text-sm mt-1">Your financial pulse</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-xl shadow-sm border border-white">
            🧑‍🎓
          </div>
        </header>

        {/* Score Strip */}
        <section>
          <div
            style={FROSTED_STYLE}
            className="rounded-3xl p-6 shadow-xl shadow-purple-500/10 flex flex-col md:flex-row items-center gap-8 md:gap-12"
          >
            {/* Overall Score */}
            <div className="flex flex-col items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-white/40 pb-6 md:pb-0 md:pr-10">
              <span className="text-xs font-bold uppercase tracking-widest text-pink-500 mb-2">
                Survival Score
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-7xl font-black tracking-tighter" style={GRADIENT_TEXT}>
                  {MOCK_SCORES.overall}
                </span>
                <span className="text-2xl font-bold text-gray-400">/100</span>
              </div>
            </div>

            {/* 3 Metric Bars */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: "Budget Control", value: MOCK_SCORES.budgetControl, color: "from-pink-400 to-rose-400" },
                { label: "Savings Habit", value: MOCK_SCORES.savingsHabit, color: "from-purple-400 to-indigo-400" },
                { label: "Impulse Control", value: MOCK_SCORES.impulseControl, color: "from-fuchsia-400 to-pink-500" },
              ].map((metric) => (
                <div key={metric.label} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-700">{metric.label}</span>
                    <span className="font-bold text-gray-900">{metric.value}%</span>
                  </div>
                  <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden shadow-inner border border-white/30">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${metric.color} transition-all duration-1000`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Goals Grid */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-gray-900">Savings Goals</h2>
            <button className="text-sm font-bold text-purple-600 bg-white/40 px-4 py-2 rounded-full hover:bg-white/60 transition-colors">
              View All
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
            {MOCK_GOALS.map((goal) => {
              const progress = Math.min(100, Math.round((goal.saved / goal.target) * 100));
              
              return (
                <div
                  key={goal.id}
                  style={FROSTED_STYLE}
                  className="rounded-3xl p-5 flex flex-col justify-between h-[160px] shadow-lg shadow-pink-500/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
                >
                  {/* Decorative background blob */}
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-pink-200/30 transition-colors pointer-events-none" />

                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center text-3xl shadow-sm border border-white/50">
                        {goal.emoji}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                          {goal.name}
                        </h3>
                        <div className="text-xs font-bold text-pink-500 bg-pink-100/50 inline-block px-2 py-0.5 rounded-md">
                          {progress}% reached
                        </div>
                      </div>
                    </div>
                    <button
                      style={GRADIENT_BTN}
                      className="w-9 h-9 flex items-center justify-center shadow-md font-bold text-xl hover:opacity-90 hover:scale-105 transition-all active:scale-95"
                      aria-label={`Add money to ${goal.name}`}
                    >
                      +
                    </button>
                  </div>

                  <div className="mt-4 relative z-10">
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-gray-800">₹{goal.saved.toLocaleString()}</span>
                      <span className="text-gray-400">of ₹{goal.target.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 w-full bg-white/50 rounded-full overflow-hidden shadow-inner border border-white/20">
                      <div
                        style={GRADIENT_BG}
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%`, ...GRADIENT_BG }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
