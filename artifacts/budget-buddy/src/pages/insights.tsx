import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

type InsightCard = { emoji: string; title: string; text: string };
type Expense = { amount: number; category: string; mood: string | null; created_at: string };

const CACHE_KEY = (uid: string) => `bb_insights_${uid}_${new Date().toISOString().slice(0, 7)}`;
const CACHE_TTL = 60 * 60 * 1000;

const CARD_GRADIENTS = [
  "linear-gradient(135deg, rgba(176,110,255,0.75), rgba(255,107,180,0.65))",
  "linear-gradient(135deg, rgba(96,165,250,0.75), rgba(52,211,153,0.65))",
  "linear-gradient(135deg, rgba(251,191,36,0.75), rgba(255,107,60,0.65))",
];

const MONTH = new Date().toLocaleString("default", { month: "long", year: "numeric" });

function SparkleLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300/50 to-pink-300/50 animate-ping" />
        <span className="text-4xl sparkle inline-block">✨</span>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-foreground">gemini is thinking...</p>
        <p className="text-xs text-muted-foreground">analysing your spending habits 🔍</p>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
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
            setInsights(data);
            setFromCache(true);
            setTimeout(() => setAnimIn(true), 50);
            return;
          }
        }
      } catch {}
    }

    setAiLoading(true);
    setAnimIn(false);

    try {
      const res = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json() as { insights: InsightCard[] };
      setInsights(json.insights);
      setFromCache(false);
      localStorage.setItem(CACHE_KEY(user.id), JSON.stringify({ data: json.insights, ts: Date.now() }));
      setTimeout(() => setAnimIn(true), 50);
    } catch {
      setError("couldn't reach the AI right now — check your connection and try again 🫶");
    } finally {
      setAiLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && user) fetchInsights();
  }, [loading, user, fetchInsights]);

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory: Record<string, number> = {};
  const byMood: Record<string, number> = {};
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    if (e.mood) byMood[e.mood] = (byMood[e.mood] ?? 0) + e.amount;
  });

  const topCat  = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const topMood = Object.entries(byMood).sort((a, b) => b[1] - a[1])[0];
  const biggest = expenses.length > 0
    ? expenses.reduce((max, e) => e.amount > max.amount ? e : max, expenses[0]!)
    : null;

  const income   = profile?.monthly_income ?? 0;
  const spentPct = income > 0 ? Math.round((totalSpent / income) * 100) : null;
  const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

  const CAT_EMOJI: Record<string, string> = {
    Food:"🍔", Coffee:"☕", Transport:"🚌", Shopping:"🛍️",
    Fun:"🎮", Study:"📚", Health:"💊", Other:"💸",
  };
  const MOOD_EMOJI: Record<string, string> = {
    Happy:"😊", Stressed:"😓", Bored:"😐", Treating:"🥳", Necessary:"📌",
  };

  return (
    <div className="p-5 pt-10 space-y-6 pb-28 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold font-serif gradient-text">where did my money go? 🔍</h1>
        <p className="text-xs text-muted-foreground">{MONTH} · AI-powered by Gemini ✨</p>
      </div>

      {/* Key stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[0,1,2].map(i => <div key={i} className="glass-card p-3 rounded-2xl animate-pulse h-20" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 rounded-2xl text-center space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">top category</p>
            <p className="text-lg">{topCat ? (CAT_EMOJI[topCat[0]] ?? "💸") : "–"}</p>
            <p className="text-xs font-bold text-foreground truncate">{topCat?.[0] ?? "No data"}</p>
          </div>
          <div className="glass-card p-3 rounded-2xl text-center space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">top mood</p>
            <p className="text-lg">{topMood ? (MOOD_EMOJI[topMood[0]] ?? "🌀") : "–"}</p>
            <p className="text-xs font-bold text-foreground truncate">{topMood?.[0] ?? "No data"}</p>
          </div>
          <div className="glass-card p-3 rounded-2xl text-center space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">biggest buy</p>
            <p className="text-lg">💳</p>
            <p className="text-xs font-bold text-foreground">{biggest ? INR(biggest.amount) : "–"}</p>
          </div>
        </div>
      )}

      {/* Budget banner */}
      {!loading && spentPct !== null && (
        <div className="glass-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {spentPct < 50 ? "🟢" : spentPct < 80 ? "🟡" : spentPct <= 100 ? "🟠" : "🔴"}
            </span>
            <div>
              <p className="text-xs font-bold text-foreground">{spentPct}% of budget used</p>
              <p className="text-[10px] text-muted-foreground">
                {INR(totalSpent)} of {INR(income)} · {expenses.length} transactions
              </p>
            </div>
          </div>
          <div className="chrome-badge px-3 py-1">{MONTH.split(" ")[0]}</div>
        </div>
      )}

      {/* AI Insights */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold font-serif gradient-text">AI Insights 🤖</h2>
            <p className="text-[10px] text-muted-foreground">
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

        {/* Loader (no cached insights yet) */}
        {(aiLoading || loading) && !insights && (
          <div className="glass-card rounded-3xl">
            <SparkleLoader />
          </div>
        )}

        {/* Error */}
        {error && !aiLoading && (
          <div className="glass-card p-5 text-center space-y-3 rounded-3xl">
            <p className="text-2xl">😿</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => fetchInsights(true)}
              className="gradient-btn px-5 py-2.5 text-sm font-bold text-white rounded-full"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Insight cards */}
        {!error && insights && (
          <div className="space-y-3">
            {insights.map((card, i) => (
              <div
                key={i}
                className="relative rounded-3xl p-5 overflow-hidden"
                style={{
                  background: CARD_GRADIENTS[i % CARD_GRADIENTS.length],
                  border: "1.5px solid rgba(255,255,255,0.45)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.35)",
                  opacity: animIn ? 1 : 0,
                  transform: animIn ? "translateY(0)" : "translateY(12px)",
                  transition: `opacity 0.4s ease ${i * 0.12}s, transform 0.4s ease ${i * 0.12}s`,
                }}
              >
                <div className="holo-overlay absolute inset-0 rounded-3xl pointer-events-none" />
                <div className="relative z-10 flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center text-2xl flex-shrink-0">
                    {card.emoji}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-white drop-shadow-sm leading-tight">{card.title}</p>
                    <p className="text-xs text-white/85 leading-relaxed">{card.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Subtle spinner when refreshing with cards already visible */}
        {aiLoading && insights && (
          <div className="text-center py-2 flex items-center justify-center gap-2">
            <span className="sparkle text-yellow-400 text-sm">✦</span>
            <p className="text-xs text-muted-foreground">refreshing insights...</p>
            <span className="sparkle text-pink-400 text-sm" style={{ animationDelay: "0.4s" }}>✦</span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!loading && expenses.length === 0 && (
        <div className="glass-card p-6 text-center space-y-2 rounded-3xl">
          <p className="text-3xl">📭</p>
          <p className="text-sm font-bold text-foreground">no expenses yet this month</p>
          <p className="text-xs text-muted-foreground">start tracking to unlock AI insights ✨</p>
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground/50">
        ✦ insights refresh automatically each month ✦
      </p>
    </div>
  );
}
