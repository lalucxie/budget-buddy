import React from "react";

export function ScoreHero() {
  const score = {
    overall: 72,
    budgetControl: 72,
    savingsHabit: 55,
    impulseControl: 88,
  };

  const goals = [
    { emoji: "🎧", name: "Headphones", saved: 400, target: 800 },
    { emoji: "✈️", name: "Trip to Goa", saved: 1200, target: 5000 },
    { emoji: "💻", name: "Laptop", saved: 8000, target: 40000 },
    { emoji: "👟", name: "Sneakers", saved: 600, target: 3000 },
  ];

  const frostedStyle = {
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(16px)",
    border: "1.5px solid rgba(255,255,255,0.7)",
  };

  const gradientText = {
    background: "linear-gradient(135deg, #FF6B9D, #B06EFF)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (score.overall / 100) * circumference;

  return (
    <div
      className="min-h-[100dvh] w-full pb-12 font-sans overflow-x-hidden flex flex-col"
      style={{ background: "linear-gradient(135deg, #E8D5F5 0%, #FFD6E7 100%)" }}
    >
      {/* Header */}
      <header className="px-6 pt-10 pb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-800">
          Budget <span style={gradientText}>Buddy</span>
        </h1>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm"
          style={frostedStyle}
        >
          💅
        </div>
      </header>

      {/* Main Score Hero */}
      <section className="flex-1 flex flex-col items-center justify-start pt-4 px-6 relative">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 mb-8">
          Survival Score
        </h2>

        {/* Gauge */}
        <div className="relative w-[220px] h-[220px] flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B06EFF" />
                <stop offset="100%" stopColor="#FF6B9D" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="16"
            />
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              filter="url(#glow)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-6xl font-black tracking-tighter"
              style={gradientText}
            >
              {score.overall}
            </span>
            <span className="text-neutral-500 font-medium mt-1">/ 100</span>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          <div
            className="flex flex-col items-center px-4 py-2 rounded-2xl"
            style={frostedStyle}
          >
            <span className="text-xs text-neutral-500 font-medium mb-1">Budget</span>
            <span className="text-lg font-bold text-neutral-800">{score.budgetControl}</span>
          </div>
          <div
            className="flex flex-col items-center px-4 py-2 rounded-2xl"
            style={frostedStyle}
          >
            <span className="text-xs text-neutral-500 font-medium mb-1">Savings</span>
            <span className="text-lg font-bold text-neutral-800">{score.savingsHabit}</span>
          </div>
          <div
            className="flex flex-col items-center px-4 py-2 rounded-2xl"
            style={frostedStyle}
          >
            <span className="text-xs text-neutral-500 font-medium mb-1">Impulse</span>
            <span className="text-lg font-bold text-neutral-800">{score.impulseControl}</span>
          </div>
        </div>
      </section>

      {/* Goals Scroller */}
      <section className="mt-12">
        <div className="px-6 mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-800">Your Goals</h2>
        </div>
        
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar px-6 pb-8 pt-2 gap-4">
          {goals.map((goal, i) => {
            const progress = (goal.saved / goal.target) * 100;
            return (
              <div
                key={i}
                className="w-[160px] h-[180px] shrink-0 snap-center rounded-[32px] p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group"
                style={frostedStyle}
              >
                <div>
                  <div className="text-4xl mb-3">{goal.emoji}</div>
                  <h3 className="font-bold text-neutral-800 leading-tight">
                    {goal.name}
                  </h3>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between items-baseline mb-2 text-xs">
                    <span className="font-bold text-neutral-800">₹{goal.saved}</span>
                    <span className="text-neutral-500">/ ₹{goal.target}</span>
                  </div>
                  <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${progress}%`,
                        background: "linear-gradient(135deg, #FF6B9D, #B06EFF)",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Add New Goal Card */}
          <div
            className="w-[160px] h-[180px] shrink-0 snap-center rounded-[32px] p-5 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm active:scale-95 transition-transform"
            style={frostedStyle}
          >
            <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#B06EFF]">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span className="font-bold text-neutral-600">New Goal</span>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
