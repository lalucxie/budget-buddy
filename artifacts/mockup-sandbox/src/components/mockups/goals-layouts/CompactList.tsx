import React from "react";
import { Plus, Share } from "lucide-react";

export function CompactList() {
  const goals = [
    { emoji: "🎧", name: "Headphones", pct: 50, saved: 400, target: 800 },
    { emoji: "✈️", name: "Trip to Goa", pct: 24, saved: 1200, target: 5000 },
    { emoji: "💻", name: "Laptop", pct: 20, saved: 8000, target: 40000 },
    { emoji: "👟", name: "Sneakers", pct: 20, saved: 600, target: 3000 },
  ];

  const scores = [
    { label: "Budget", value: 72, color: "#FF6B9D" },
    { label: "Savings", value: 55, color: "#B06EFF" },
    { label: "Impulse", value: 88, color: "#4DE1C1" },
  ];

  const glassStyle = {
    background: "rgba(255, 255, 255, 0.55)",
    backdropFilter: "blur(16px)",
    border: "1.5px solid rgba(255, 255, 255, 0.7)",
  };

  const gradientTextStyle = {
    background: "linear-gradient(135deg, #FF6B9D, #B06EFF)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  const CircularDial = ({ value, label, color }: { value: number; label: string; color: string }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-[80px] h-[80px] flex items-center justify-center">
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={color}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-sm font-bold text-gray-800">{value}%</span>
        </div>
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</span>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center p-6 font-sans overflow-y-auto"
      style={{
        background: "linear-gradient(135deg, #E8D5F5 0%, #FFD6E7 100%)",
      }}
    >
      <div className="w-full max-w-md flex flex-col gap-6 pb-12">
        {/* Header */}
        <div className="flex justify-between items-center mt-4">
          <h1 className="text-3xl font-black tracking-tight" style={gradientTextStyle}>
            Goals
          </h1>
          <button className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-pink-500 hover:scale-105 transition-transform">
            <Plus size={24} />
          </button>
        </div>

        {/* Goals List */}
        <div className="rounded-3xl p-2 flex flex-col" style={glassStyle}>
          {goals.map((goal, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 ${
                idx !== goals.length - 1 ? "border-b border-white/50" : ""
              }`}
            >
              <div className="text-3xl w-12 h-12 flex items-center justify-center bg-white/40 rounded-2xl shrink-0">
                {goal.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-end mb-1">
                  <h3 className="font-bold text-gray-800 truncate pr-2">{goal.name}</h3>
                  <span className="text-xs font-medium text-gray-500 shrink-0">
                    ₹{goal.saved}/₹{goal.target}
                  </span>
                </div>
                <div className="h-2 w-full bg-white/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${goal.pct}%`,
                      background: "linear-gradient(90deg, #FF6B9D, #B06EFF)",
                    }}
                  />
                </div>
              </div>
              <div className="text-sm font-bold text-purple-600 w-9 text-right shrink-0">
                {goal.pct}%
              </div>
              <button className="h-8 w-8 rounded-full bg-white/60 flex items-center justify-center text-purple-600 shrink-0 hover:bg-white transition-colors">
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>

        {/* College Survival Score */}
        <div className="mt-4">
          <h2 className="text-xl font-black mb-4 text-center" style={gradientTextStyle}>
            Survival Score
          </h2>
          
          <div className="rounded-3xl p-6 flex flex-col items-center gap-6" style={glassStyle}>
            {/* 3 mini dials */}
            <div className="flex justify-between w-full px-2">
              {scores.map((score, idx) => (
                <CircularDial key={idx} {...score} />
              ))}
            </div>

            {/* Overall Score */}
            <div className="flex flex-col items-center mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-gray-800 tracking-tighter">72</span>
                <span className="text-xl font-bold text-gray-500">/ 100</span>
              </div>
              <div className="mt-2 px-4 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-md">
                Savvy Spender
              </div>
            </div>

            {/* Share Button */}
            <button className="w-full mt-4 py-3.5 bg-white/80 hover:bg-white text-purple-700 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm">
              <Share size={18} />
              Share Score
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
