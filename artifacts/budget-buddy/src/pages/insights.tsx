import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

type InsightCard = { emoji: string; title: string; text: string };
type Expense = { amount: number; category: string; mood: string | null; created_at: string };

const CACHE_KEY = (uid: string) => `bb_insights_${uid}_${new Date().toISOString().slice(0, 7)}`;
const CACHE_TTL = 60 * 60 * 1000;

const CARD_GRADIENTS = [
  "linear-gradient(135deg, #FF6B9D 0%, #B06EFF 100%)",
  "linear-gradient(135deg, #60A5FA 0%, #34D399 100%)",
  "linear-gradient(135deg, #FBBF24 0%, #FF7A3C 100%)",
];

const MONTH = new Date().toLocaleString("default", { month: "long", year: "numeric" });

const CAT_EMOJI: Record<string, string> = {
  Food: "🍔", Coffee: "☕", Transport: "🚌", Shopping: "🛍️",
  Fun: "🎮", Study: "📚", Health: "💊", Other: "💸",
};
const MOOD_EMOJI: Record<string, string> = {
  Happy: "😊", Stressed: "😓", Bored: "😐", Treating: "🥳", Necessary: "📌",
};

type Personality = { id: string; emoji: string; name: string; desc: string; gradient: string };
const PERSONALITIES: Record<string, Personality> = {
  saver:      { id: "saver",      emoji: "🌱", name: "The Saver",        desc: "You're playing the long game and winning! Low spend, high save — future you is gonna be rich rich 💰", gradient: "linear-gradient(135deg, rgba(52,211,153,0.9), rgba(16,185,129,0.8), rgba(96,165,250,0.7))" },
  foodie:     { id: "foodie",     emoji: "🍔", name: "The Foodie",       desc: "Your heart (and wallet) lives in the food court. No shame — good food is self-care too bestie 🍕",       gradient: "linear-gradient(135deg, rgba(251,191,36,0.9), rgba(245,158,11,0.8), rgba(255,107,60,0.7))" },
  impulse:    { id: "impulse",    emoji: "⚡", name: "The Impulse Buyer", desc: "Bored? Buy something. Stressed? Retail therapy. Your mood drives your money — let's fix that 💅",       gradient: "linear-gradient(135deg, rgba(248,113,113,0.9), rgba(239,68,68,0.8), rgba(176,110,255,0.7))" },
  planner:    { id: "planner",    emoji: "📊", name: "The Planner",      desc: "Spreadsheet energy but make it cute. Your spending is balanced, intentional, and lowkey impressive.",     gradient: "linear-gradient(135deg, rgba(176,110,255,0.9), rgba(139,92,246,0.8), rgba(96,165,250,0.7))" },
  adventurer: { id: "adventurer", emoji: "✈️", name: "The Explorer",    desc: "Transport, fun, experiences — you invest in memories not things. Living your best life! 🌍",             gradient: "linear-gradient(135deg, rgba(96,165,250,0.9), rgba(59,130,246,0.8), rgba(52,211,153,0.7))" },
};

function SparkleLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <div className="flex gap-2 items-end">
        {["✨", "💫", "✨"].map((s, i) => (
          <span
            key={i}
            className="text-2xl inline-block animate-bounce"
            style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.8s" }}
          >
            {s}
          </span>
        ))}
      </div>
      <p className="text-sm font-bold text-foreground">your AI bestie is thinking...</p>
      <p className="text-xs text-muted-foreground">cooking up personalised tips 🔮</p>
    </div>
  );
}

export default function Insights() {
  const { user, profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [insights, setInsights] = useState<InsightCard[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    if (!user) return;
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    supabase
      .from("expenses")
      .select("amount,category,mood,created_at")
      .eq("user_id", user.id)
      .gte("created_at", start)
      .then(({ data }) => {
        setExpenses((data ?? []) as Expense[]);
        setLoading(false);
      });
  }, [user]);

  const fetchInsights = useCallback(async (force = false) => {
    if (!user) return;
    setError(null);
    if (!force) {
      try {
        const raw = localStorage.getItem(CACHE_KEY(user.id));
        if (raw) {
          const { data, ts } = JSON.parse(raw) as { data: InsightCard[]; ts: number };
          if (Date.now() - ts < CACHE_TTL) {
            setInsights(data); setFromCache(true);
            setTimeout(() => setAnimIn(true), 50);
            return;
          }
        }
      } catch {}
    }
    setAiLoading(true); setAnimIn(false);
    try {
      const res = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json() as { insights: InsightCard[] };
      setInsights(json.insights); setFromCache(false);
      localStorage.setItem(CACHE_KEY(user.id), JSON.stringify({ data: json.insights, ts: Date.now() }));
      setTimeout(() => setAnimIn(true), 50);
    } catch {
      setError("AI Insights coming soon! ");
    } finally {
      setAiLoading(false);
    }
  }, [user]);

  useEffect(() => { if (!loading && user) fetchInsights(); }, [loading, user, fetchInsights]);

  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    expenses.forEach(e => { m[e.category] = (m[e.category] ?? 0) + e.amount; });
    return m;
  }, [expenses]);
  const byMood = useMemo(() => {
    const m: Record<string, number> = {};
    expenses.forEach(e => { if (e.mood) m[e.mood] = (m[e.mood] ?? 0) + e.amount; });
    return m;
  }, [expenses]);

  const income = profile?.monthly_income ?? 0;
  const spentPct = income > 0 ? (totalSpent / income) * 100 : 0;
  const topCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const topMood = Object.entries(byMood).sort((a, b) => b[1] - a[1])[0];
  const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

  const personality = useMemo((): Personality => {
    if (expenses.length === 0) return PERSONALITIES.planner;
    const topCatKey = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    const mooded = expenses.filter(e => e.mood);
    const impulsePct = mooded.length > 0 ? mooded.filter(e => e.mood === "Bored" || e.mood === "Stressed").length / mooded.length : 0;
    if (income > 0 && spentPct < 30) return PERSONALITIES.saver;
    if (impulsePct >= 0.45) return PERSONALITIES.impulse;
    if (topCatKey === "Food" || topCatKey === "Coffee") return PERSONALITIES.foodie;
    const adventureSpend = (byCategory["Transport"] ?? 0) + (byCategory["Fun"] ?? 0);
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
    if (total > 0 && adventureSpend / total > 0.4) return PERSONALITIES.adventurer;
    if (Object.keys(byCategory).length >= 3) return PERSONALITIES.planner;
    return PERSONALITIES.planner;
  }, [expenses, byCategory, income, spentPct]);

  const moodEntries = Object.entries(byMood).sort((a, b) => b[1] - a[1]);
  const maxMoodSpend = moodEntries[0]?.[1] ?? 1;

  const daysInMonth = new Date().getDate();
  const dailyAvg = daysInMonth > 0 ? totalSpent / daysInMonth : 0;
  const projectedTotal = dailyAvg * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const visualCards = useMemo(() => {
    if (expenses.length === 0) return null;
    const cards = [];
    if (topCat) {
      cards.push({
        emoji: CAT_EMOJI[topCat[0]] ?? "💸",
        title: `${topCat[0]} is your top spend`,
        tip: `Try capping your ${topCat[0].toLowerCase()} budget at ${INR(topCat[1] * 0.8)} next week — that's a 20% cut that adds up fast! ✨`,
      });
    }
    if (topMood) {
      cards.push({
        emoji: MOOD_EMOJI[topMood[0]] ?? "💫",
        title: `you spend most when ${topMood[0].toLowerCase()}`,
        tip: `Next time you feel ${topMood[0].toLowerCase()}, try a 10-min walk before opening your wallet. You got this 💪`,
      });
    }
    if (income > 0) {
      const remaining = income - totalSpent;
      cards.push({
        emoji: remaining >= 0 ? "📈" : "📉",
        title: remaining >= 0 ? `${INR(remaining)} left to slay` : `over budget by ${INR(Math.abs(remaining))}`,
        tip: remaining >= 0
          ? `You're averaging ${INR(dailyAvg)}/day — keep it up and you'll save ${INR(remaining)} this month! 🌱`
          : `Pause non-essentials for the rest of the month and aim to recover ${INR(Math.abs(remaining) * 0.5)} 🫶`,
      });
    } else {
      cards.push({
        emoji: "📅",
        title: `averaging ${INR(dailyAvg)}/day`,
        tip: `At this rate you'll spend ${INR(projectedTotal)} this month. Set a monthly budget in Settings to track better! ⭐`,
      });
    }
    return cards.slice(0, 3);
  }, [expenses, topCat, topMood, income, totalSpent, dailyAvg, projectedTotal]);

  return (
    <div className="p-5 pt-10 space-y-7 pb-28 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-2xl font-extrabold font-serif gradient-text">your money story ✨</h1>
        <p className="text-xs text-muted-foreground">{MONTH} · AI-powered by Gemini</p>
      </div>

      {/* ── 1. SPENDING PERSONALITY CARD ───────────────────────────── */}
      {loading ? (
        <div className="rounded-3xl animate-pulse h-48" style={{ background: "rgba(255,255,255,0.35)" }} />
      ) : (
        <div
          className="relative rounded-3xl p-6 overflow-hidden"
          style={{
            background: personality.gradient,
            border: "1.5px solid rgba(255,255,255,0.5)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.13), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          <div className="holo-overlay absolute inset-0 rounded-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center text-5xl shadow-inner flex-shrink-0">
                {personality.emoji}
              </div>
              <div>
                <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-1">spending personality</p>
                <p className="text-2xl font-extrabold text-white drop-shadow leading-tight">{personality.name}</p>
              </div>
            </div>
            <p className="text-sm text-white/90 leading-relaxed font-medium">{personality.desc}</p>
            <div className="flex items-center gap-3 pt-1">
              <div className="chrome-badge px-3 py-1 bg-white/20 border-white/40 text-white text-xs font-bold">
                {expenses.length} transactions
              </div>
              <div className="chrome-badge px-3 py-1 bg-white/20 border-white/40 text-white text-xs font-bold">
                {INR(totalSpent)} spent
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. VISUAL INSIGHT CARDS ────────────────────────────────── */}
      {!loading && visualCards && (
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold font-serif gradient-text">spending patterns 🔍</h2>
          <div className="space-y-3">
            {visualCards.map((card, i) => (
              <div
                key={i}
                className="relative rounded-3xl p-5 overflow-hidden"
                style={{
                  background: CARD_GRADIENTS[i],
                  border: "1.5px solid rgba(255,255,255,0.45)",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.35)",
                  opacity: animIn || !aiLoading ? 1 : 0,
                  transform: animIn || !aiLoading ? "translateY(0)" : "translateY(10px)",
                  transition: `opacity 0.45s ease ${i * 0.1}s, transform 0.45s ease ${i * 0.1}s`,
                }}
              >
                <div className="holo-overlay absolute inset-0 rounded-3xl pointer-events-none" />
                <div className="relative z-10 flex gap-4 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center text-3xl flex-shrink-0 shadow-inner">
                    {card.emoji}
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-white drop-shadow leading-tight">{card.title}</p>
                    <p className="text-xs text-white/85 leading-relaxed">{card.tip}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. WEEKLY MOOD CHART ────────────────────────────────────── */}
      {!loading && moodEntries.length > 0 && (
        <div className="glass-card p-5 space-y-4 rounded-3xl">
          <div>
            <h2 className="text-lg font-extrabold font-serif gradient-text">mood spending chart 🎭</h2>
            {topMood && (
              <p className="text-xs text-muted-foreground mt-0.5">
                you spend most when {MOOD_EMOJI[topMood[0]] ?? "💫"} <span className="font-semibold">{topMood[0].toLowerCase()}</span>
              </p>
            )}
          </div>
          <div className="space-y-3">
            {moodEntries.map(([mood, amount]) => {
              const pct = Math.round((amount / maxMoodSpend) * 100);
              return (
                <div key={mood} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span className="text-base">{MOOD_EMOJI[mood] ?? "💫"}</span>
                      {mood}
                    </span>
                    <span className="text-xs font-bold text-foreground">{INR(amount)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/40 rounded-full overflow-hidden border border-white/50">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: mood === topMood?.[0]
                          ? "linear-gradient(90deg, #FF6B9D, #B06EFF)"
                          : "linear-gradient(90deg, rgba(176,110,255,0.6), rgba(255,107,157,0.5))",
                        boxShadow: mood === topMood?.[0] ? "0 0 8px rgba(255,107,157,0.5)" : "none",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. GEMINI AI TIPS ──────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold font-serif gradient-text">your AI bestie says... 🤖✨</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {fromCache ? "cached · " : ""}gemini 1.5 flash
            </p>
          </div>
          <button
            onClick={() => fetchInsights(true)}
            disabled={aiLoading || loading}
            className="chrome-badge px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 hover:opacity-80 transition-opacity disabled:opacity-40 cursor-pointer"
          >
            <span className={aiLoading ? "animate-spin inline-block" : ""}>✦</span>
            {aiLoading ? "thinking..." : "Refresh"}
          </button>
        </div>

        {(aiLoading || loading) && !insights && (
          <div className="glass-card rounded-3xl">
            <SparkleLoader />
          </div>
        )}

        {error && !aiLoading && (
          <div className="glass-card p-5 text-center space-y-3 rounded-3xl">
            <p className="text-2xl">🚀</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button onClick={() => fetchInsights(true)} className="gradient-btn px-5 py-2.5 text-sm font-bold text-white rounded-full">
              Try Again
            </button>
          </div>
        )}

        {!error && insights && (
          <div className="space-y-3">
            {insights.map((card, i) => (
              <div
                key={i}
                className="glass-card p-4 rounded-2xl flex gap-3 items-start"
                style={{
                  opacity: animIn ? 1 : 0,
                  transform: animIn ? "translateY(0)" : "translateY(8px)",
                  transition: `opacity 0.4s ease ${i * 0.12}s, transform 0.4s ease ${i * 0.12}s`,
                  border: "1.5px solid rgba(176,110,255,0.25)",
                  background: "rgba(255,255,255,0.62)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length], boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>
                  {card.emoji}
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-foreground leading-tight">{card.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {aiLoading && insights && (
          <div className="text-center py-2 flex items-center justify-center gap-2">
            <span className="sparkle text-yellow-400 text-sm">✦</span>
            <p className="text-xs text-muted-foreground">refreshing...</p>
            <span className="sparkle text-pink-400 text-sm" style={{ animationDelay: "0.4s" }}>✦</span>
          </div>
        )}
      </div>

      {!loading && expenses.length === 0 && (
        <div className="glass-card p-6 text-center space-y-2 rounded-3xl">
          <p className="text-3xl">📭</p>
          <p className="text-sm font-bold text-foreground">no expenses yet this month</p>
          <p className="text-xs text-muted-foreground">start tracking to unlock AI insights ✨</p>
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground/50">✦ insights refresh automatically each month ✦</p>
    </div>
  );
}
