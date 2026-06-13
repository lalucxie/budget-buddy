import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

// ─── Pet data ─────────────────────────────────────────────────────────────────
const PETS: Record<string, {
  emoji: string; name: string; species: string;
  happy: string; content: string; worried: string; sad: string;
}> = {
  luna: {
    emoji: "🐱", name: "Luna", species: "Cat",
    happy:   "luna is purring with pride! you're absolutely slaying your budget ✨",
    content: "luna is chilling... things are looking decent bestie 😌",
    worried: "luna is watching your wallet nervously... slow down a little? 👀",
    sad:     "luna is devastated 😿 you've gone over budget this month...",
  },
  mochi: {
    emoji: "🐼", name: "Mochi", species: "Panda",
    happy:   "mochi is doing the happy bamboo dance! ✨ keep it up bestie",
    content: "mochi is munching peacefully... you're doing okay 🎋",
    worried: "mochi is sweating a little 💦 maybe skip the next splurge?",
    sad:     "mochi has gone into sad hibernation mode 🌧️ budget exceeded...",
  },
  kitsune: {
    emoji: "🦊", name: "Kitsune", species: "Fox",
    happy:   "kitsune is glowing with 9 tails! incredible budget skills ✨",
    content: "kitsune is plotting... a cunning mid-month position 🌟",
    worried: "kitsune's tails are drooping 💦 spending's getting spicy...",
    sad:     "kitsune has retreated to the forest 🌧️ budget exceeded...",
  },
  ribbit: {
    emoji: "🐸", name: "Ribbit", species: "Frog",
    happy:   "ribbit is hopping with joy! 🍃 your wallet is thriving!",
    content: "ribbit is sitting on its lily pad... things are stable ⭐",
    worried: "ribbit is sweating 💦 the pond is getting shallow...",
    sad:     "ribbit is in the rain 🌧️ you've hopped over budget...",
  },
};

type PetState = "happy" | "content" | "worried" | "sad";

const STATE_CONFIG: Record<PetState, {
  label: string;
  aura: string;
  bg: string;
  moodColor: string;
  barColor: string;
  icon: string;
  sparkles: boolean;
}> = {
  happy:   { label: "Absolutely Thriving ✨", aura: "0 0 60px rgba(52,211,153,0.5), 0 0 120px rgba(52,211,153,0.2)",  bg: "rgba(52,211,153,0.1)",   moodColor: "#34D399", barColor: "linear-gradient(90deg,#6EE7B7,#34D399)", icon: "✨", sparkles: true  },
  content: { label: "Pretty Chill 😌",        aura: "0 0 40px rgba(96,165,250,0.4), 0 0 80px rgba(96,165,250,0.15)",  bg: "rgba(96,165,250,0.08)",  moodColor: "#60A5FA", barColor: "linear-gradient(90deg,#93C5FD,#60A5FA)", icon: "⭐", sparkles: false },
  worried: { label: "Getting Nervous 💦",     aura: "0 0 40px rgba(251,191,36,0.45), 0 0 80px rgba(251,191,36,0.2)", bg: "rgba(251,191,36,0.08)",  moodColor: "#FBBF24", barColor: "linear-gradient(90deg,#FDE68A,#FBBF24)", icon: "💦", sparkles: false },
  sad:     { label: "Really Worried 🌧️",      aura: "0 0 40px rgba(248,113,113,0.4), 0 0 80px rgba(248,113,113,0.2)",bg: "rgba(248,113,113,0.08)", moodColor: "#F87171", barColor: "linear-gradient(90deg,#FCA5A5,#F87171)", icon: "🌧️", sparkles: false },
};

// ─── Personality data ─────────────────────────────────────────────────────────
type Personality = {
  id: string; emoji: string; name: string;
  desc: string; tags: string[];
  gradient: string;
};

const PERSONALITIES: Record<string, Personality> = {
  saver: {
    id: "saver", emoji: "🌱", name: "The Saver",
    desc: "You're playing the long game and winning! Low spend, high save — future you is gonna be rich rich.",
    tags: ["#LowSpend", "#GoalGetter", "#FutureRich"],
    gradient: "linear-gradient(135deg, rgba(52,211,153,0.85), rgba(16,185,129,0.75), rgba(96,165,250,0.70))",
  },
  foodie: {
    id: "foodie", emoji: "🍔", name: "The Foodie",
    desc: "Your heart (and wallet) lives in the food court. No shame — good food is self-care too bestie 🍕",
    tags: ["#FoodFirst", "#TreatYoSelf", "#NoRegrets"],
    gradient: "linear-gradient(135deg, rgba(251,191,36,0.85), rgba(245,158,11,0.80), rgba(255,107,60,0.70))",
  },
  impulse: {
    id: "impulse", emoji: "⚡", name: "The Impulse Buyer",
    desc: "Bored? Buy something. Stressed? Retail therapy. Your mood drives your money — let's work on that 💅",
    tags: ["#MoodSpender", "#CartTherapy", "#GlowUpNeeded"],
    gradient: "linear-gradient(135deg, rgba(248,113,113,0.85), rgba(239,68,68,0.80), rgba(176,110,255,0.70))",
  },
  planner: {
    id: "planner", emoji: "📊", name: "The Planner",
    desc: "Spreadsheet energy, but make it cute. Your spending is balanced, intentional, and lowkey impressive.",
    tags: ["#BalancedQueen", "#MoneyMindful", "#BudgetBrain"],
    gradient: "linear-gradient(135deg, rgba(176,110,255,0.85), rgba(139,92,246,0.80), rgba(96,165,250,0.70))",
  },
  adventurer: {
    id: "adventurer", emoji: "✈️", name: "The Adventurer",
    desc: "Transport, fun, experiences — you invest in memories not things. Living your best life while it's cheap!",
    tags: ["#ExperienceFirst", "#GoExplore", "#YOLO(Responsibly)"],
    gradient: "linear-gradient(135deg, rgba(96,165,250,0.85), rgba(59,130,246,0.80), rgba(52,211,153,0.70))",
  },
};

type Expense = {
  amount: number; category: string; mood: string | null;
  created_at: string;
};

// ─── Floating sparkle ─────────────────────────────────────────────────────────
function Sparkle({ style }: { style: React.CSSProperties }) {
  return (
    <span className="absolute pointer-events-none text-yellow-300 sparkle select-none" style={style}>
      ✦
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Pet() {
  const { user, profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [animBar, setAnimBar]   = useState(false);

  const income   = profile?.monthly_income ?? 0;
  const petKey   = profile?.pet_choice ?? "luna";
  const petData  = PETS[petKey] ?? PETS.luna;

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    supabase
      .from("expenses")
      .select("amount,category,mood,created_at")
      .eq("user_id", user.id)
      .gte("created_at", start)
      .then(({ data }) => {
        setExpenses((data ?? []) as Expense[]);
        setLoading(false);
        setTimeout(() => setAnimBar(true), 100);
      });
  }, [user]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const spentPct   = income > 0 ? (totalSpent / income) * 100 : 0;

  const petState: PetState = spentPct < 50 ? "happy" : spentPct < 80 ? "content" : spentPct <= 100 ? "worried" : "sad";
  const happiness  = Math.max(0, Math.round(100 - spentPct));
  const cfg        = STATE_CONFIG[petState];

  // Spending personality
  const personality = useMemo((): Personality => {
    if (expenses.length === 0) return PERSONALITIES.planner;

    // Category totals
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount; });
    const topCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

    // Impulse check
    const mooded    = expenses.filter(e => e.mood);
    const impulsive = mooded.filter(e => e.mood === "Bored" || e.mood === "Stressed").length;
    const impulsePct = mooded.length > 0 ? impulsive / mooded.length : 0;

    // Saver check: very low spending
    if (income > 0 && spentPct < 30) return PERSONALITIES.saver;

    // Impulse buyer
    if (impulsePct >= 0.45) return PERSONALITIES.impulse;

    // Foodie
    if (topCat === "Food" || topCat === "Coffee") return PERSONALITIES.foodie;

    // Adventurer: transport or fun dominant
    const adventureSpend = (byCategory["Transport"] ?? 0) + (byCategory["Fun"] ?? 0);
    const totalCats = Object.values(byCategory).reduce((s, v) => s + v, 0);
    if (totalCats > 0 && adventureSpend / totalCats > 0.4) return PERSONALITIES.adventurer;

    // Planner: at least 3 categories used
    if (Object.keys(byCategory).length >= 3) return PERSONALITIES.planner;

    return PERSONALITIES.planner;
  }, [expenses, income, spentPct]);

  const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

  return (
    <div className="p-5 pt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">

      {/* ── SECTION 1: Financial Pet ───────────────────────────────── */}
      <div className="text-center space-y-1 mb-2">
        <h1 className="text-2xl font-extrabold font-serif gradient-text">Your Finance Pet 🐾</h1>
        <p className="text-xs text-muted-foreground">their mood mirrors your wallet 💕</p>
      </div>

      <div className="glass-card p-6 flex flex-col items-center gap-5">

        {/* Pet avatar with state aura */}
        <div className="relative flex items-center justify-center" style={{ width: 176, height: 176 }}>
          {/* Aura ring */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-1000"
            style={{ boxShadow: cfg.aura, background: cfg.bg, borderRadius: "50%" }}
          />

          {/* Sparkles (happy state only) */}
          {cfg.sparkles && !loading && (
            <>
              <Sparkle style={{ top: 4,  left: 12,  fontSize: 20, animationDelay: "0s",    animationDuration: "1.4s" }} />
              <Sparkle style={{ top: 0,  right: 20, fontSize: 14, animationDelay: "0.4s",  animationDuration: "1.8s" }} />
              <Sparkle style={{ bottom: 10, left: 6, fontSize: 16, animationDelay: "0.8s", animationDuration: "1.6s" }} />
              <Sparkle style={{ bottom: 4, right: 10, fontSize: 22, animationDelay: "0.2s",animationDuration: "2s"   }} />
              <Sparkle style={{ top: "30%", left: -4, fontSize: 12, animationDelay: "1s",  animationDuration: "1.5s" }} />
              <Sparkle style={{ top: "40%", right: -4,fontSize: 18, animationDelay: "0.6s",animationDuration: "1.9s" }} />
            </>
          )}

          {/* Pet emoji */}
          <div
            className="relative w-32 h-32 rounded-full bg-white/50 border-4 border-white flex items-center justify-center float"
            style={{ zIndex: 1 }}
          >
            <span className="text-7xl select-none">{petData.emoji}</span>
          </div>

          {/* Mood icon badge */}
          {!loading && (
            <div className="absolute -bottom-1 -right-1 z-10 w-10 h-10 rounded-full bg-white/80 border-2 border-white shadow-md flex items-center justify-center text-xl">
              {cfg.icon}
            </div>
          )}
        </div>

        {/* Name + mood badge */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold font-serif text-foreground">{petData.name}</h2>
          <div
            className="chrome-badge px-4 py-1.5 text-xs font-bold inline-block"
            style={{ color: cfg.moodColor }}
          >
            {loading ? "checking vibes..." : cfg.label}
          </div>
        </div>

        {/* Speech bubble */}
        {!loading && (
          <div className="relative w-full max-w-xs">
            <div className="glass-card px-5 py-4 text-center rounded-2xl relative" style={{ borderColor: `${cfg.moodColor}40` }}>
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderBottom: `10px solid rgba(255,255,255,0.7)`,
                }}
              />
              <p className="text-sm font-medium text-foreground leading-relaxed italic">
                "{petData[petState]}"
              </p>
            </div>
          </div>
        )}

        {/* Happiness meter */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">happiness meter</span>
            {loading
              ? <div className="w-10 h-3 bg-white/40 rounded-full animate-pulse" />
              : <span style={{ color: cfg.moodColor }}>{happiness}%</span>
            }
          </div>
          <div className="w-full h-4 bg-white/40 rounded-full overflow-hidden border border-white/60">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{
                width: animBar && !loading ? `${Math.max(4, happiness)}%` : "0%",
                background: cfg.barColor,
                boxShadow: `0 0 10px ${cfg.moodColor}60`,
              }}
            >
              {/* Shimmer on bar */}
              <div className="absolute inset-0 shimmer" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
            <span>{loading ? "..." : `${INR(totalSpent)} spent`}</span>
            <span>{loading ? "..." : `${INR(income)} budget`}</span>
          </div>
        </div>

        {/* Stat pills */}
        {!loading && (
          <div className="flex gap-2 flex-wrap justify-center">
            <div className="chrome-badge px-3 py-1.5">
              {Math.round(Math.min(100, spentPct))}% of budget used
            </div>
            <div className="chrome-badge px-3 py-1.5">
              {INR(Math.max(0, income - totalSpent))} remaining
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: Spending Personality ───────────────────────── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-extrabold font-serif gradient-text">Spending Personality 🌈</h2>
          <p className="text-xs text-muted-foreground">based on this month's data</p>
        </div>

        {loading ? (
          <div className="rounded-3xl overflow-hidden animate-pulse" style={{ height: 260, background: "rgba(255,255,255,0.3)" }} />
        ) : (
          <div
            className="relative rounded-3xl p-6 overflow-hidden space-y-4"
            style={{
              background: personality.gradient,
              border: "1.5px solid rgba(255,255,255,0.5)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.35)",
            }}
          >
            {/* Holo shimmer overlay */}
            <div className="holo-overlay absolute inset-0 rounded-3xl pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center text-4xl shadow-inner flex-shrink-0">
                {personality.emoji}
              </div>
              <div>
                <p className="text-xl font-extrabold text-white drop-shadow-sm">{personality.name}</p>
                <p className="text-xs text-white/75 font-medium">{petData.species} owner vibes 💕</p>
              </div>
            </div>

            <p className="relative z-10 text-sm text-white/90 leading-relaxed font-medium">
              {personality.desc}
            </p>

            {/* Trait tags */}
            <div className="relative z-10 flex flex-wrap gap-2">
              {personality.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-bold text-white border border-white/40 bg-white/20 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-muted-foreground/60 font-medium">
          ✦ personality updates at the start of each month ✦
        </p>
      </div>

      {/* ── Pet tips ──────────────────────────────────────────────── */}
      {!loading && (
        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{petData.emoji}</span>
            <p className="text-sm font-bold text-foreground">{petData.name}'s advice 💡</p>
          </div>
          {petState === "happy"   && <p className="text-xs text-muted-foreground">You're under 50% of your budget with time left — consider adding extra to a savings goal! ⭐</p>}
          {petState === "content" && <p className="text-xs text-muted-foreground">Halfway there! Keep your daily spend in check and you'll end the month strong 💪</p>}
          {petState === "worried" && <p className="text-xs text-muted-foreground">You're over 80% of your budget. Try the 24-hour rule: wait a day before any non-essential purchase 🫶</p>}
          {petState === "sad"     && <p className="text-xs text-muted-foreground">Over budget this month — note what triggered the overspend and plan next month's budget around it 🌱</p>}
        </div>
      )}
    </div>
  );
}
