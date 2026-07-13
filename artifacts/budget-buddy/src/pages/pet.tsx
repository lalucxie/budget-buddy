import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

const PETS: Record<string, {
  emoji: string; name: string; species: string;
  happy: string; content: string; worried: string; sad: string;
}> = {
  luna:    { emoji: "🐱", name: "Luna",   species: "Cat",   happy: "omg you're literally killing it! i'm so proud of you bestie 🌟", content: "we're doing okay! just watch the spending a little 👀", worried: "bestie... we're getting close to the limit 😬 maybe skip that takeout today?", sad: "i'm not mad just disappointed... let's fix this together 💔" },
  mochi:   { emoji: "🐼", name: "Mochi",  species: "Panda", happy: "omg you're literally killing it! i'm so proud of you bestie 🌟", content: "we're doing okay! just watch the spending a little 👀", worried: "bestie... we're getting close to the limit 😬 maybe skip that takeout today?", sad: "i'm not mad just disappointed... let's fix this together 💔" },
  kitsune: { emoji: "🦊", name: "Kitsune",species: "Fox",   happy: "omg you're literally killing it! i'm so proud of you bestie 🌟", content: "we're doing okay! just watch the spending a little 👀", worried: "bestie... we're getting close to the limit 😬 maybe skip that takeout today?", sad: "i'm not mad just disappointed... let's fix this together 💔" },
  ribbit:  { emoji: "🐸", name: "Ribbit", species: "Frog",  happy: "omg you're literally killing it! i'm so proud of you bestie 🌟", content: "we're doing okay! just watch the spending a little 👀", worried: "bestie... we're getting close to the limit 😬 maybe skip that takeout today?", sad: "i'm not mad just disappointed... let's fix this together 💔" },
};

type PetState = "happy" | "content" | "worried" | "sad";

const STATE_CONFIG: Record<PetState, {
  label: string; aura: string; bg: string; moodColor: string;
  barColor: string; icon: string; sparkles: boolean;
  animClass: string; raincloud: boolean;
}> = {
  happy:   { label: "Absolutely Thriving ✨", aura: "0 0 60px rgba(52,211,153,0.5), 0 0 120px rgba(52,211,153,0.2)", bg: "rgba(52,211,153,0.12)",   moodColor: "#34D399", barColor: "linear-gradient(90deg,#6EE7B7,#34D399)", icon: "✨", sparkles: true,  animClass: "pet-bounce",  raincloud: false },
  content: { label: "Pretty Chill 😌",        aura: "0 0 40px rgba(96,165,250,0.4), 0 0 80px rgba(96,165,250,0.15)",  bg: "rgba(96,165,250,0.09)",  moodColor: "#60A5FA", barColor: "linear-gradient(90deg,#93C5FD,#60A5FA)", icon: "⭐", sparkles: false, animClass: "pet-sway",    raincloud: false },
  worried: { label: "Getting Nervous 💦",     aura: "0 0 40px rgba(251,191,36,0.45), 0 0 80px rgba(251,191,36,0.2)", bg: "rgba(251,191,36,0.09)",  moodColor: "#FBBF24", barColor: "linear-gradient(90deg,#FDE68A,#FBBF24)", icon: "💦", sparkles: false, animClass: "pet-shake",   raincloud: false },
  sad:     { label: "Really Worried 🌧️",      aura: "0 0 40px rgba(248,113,113,0.4), 0 0 80px rgba(248,113,113,0.2)",bg: "rgba(248,113,113,0.09)", moodColor: "#F87171", barColor: "linear-gradient(90deg,#FCA5A5,#F87171)", icon: "🌧️", sparkles: false, animClass: "pet-droop",   raincloud: true  },
};

const CHEER_TIPS = [
  "Try the 24-hour rule: wait a day before any non-essential buy! You'll be surprised how often you skip it 🌱",
  "Pack lunch once this week — it's not just money, it's a tiny win that builds momentum 💪",
  "Set a ₹200 fun fund for the week. Once it's gone, it's gone. Limits = power bestie ✨",
  "Track every expense for 3 days. Awareness is the first step to slaying your budget 📊",
  "Text a friend about your goal — accountability makes it 65% more likely to happen 💕",
];

type Expense = { amount: number; category: string; mood: string | null; created_at: string };
type PetMessage = { text: string; date: string; state: PetState };

const MSG_KEY = (uid: string) => `bb_petmsgs_${uid}`;

function Sparkle({ style }: { style: React.CSSProperties }) {
  return <span className="absolute pointer-events-none text-yellow-300 sparkle select-none" style={style}>✦</span>;
}

function RainDrop({ style }: { style: React.CSSProperties }) {
  return <span className="absolute pointer-events-none select-none" style={{ ...style, animation: "rain-fall 1.2s linear infinite" }}>💧</span>;
}

export default function Pet() {
  const { user, profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [animBar, setAnimBar] = useState(false);
  const [cheerMode, setCheerMode] = useState(false);
  const [cheerTip, setCheerTip] = useState("");
  const [cheerAnim, setCheerAnim] = useState(false);
  const [messages, setMessages] = useState<PetMessage[]>([]);

  const income  = profile?.monthly_income ?? 0;
  const petKey  = profile?.pet_choice ?? "luna";
  const petData = PETS[petKey] ?? PETS.luna!;

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
    try {
      const raw = localStorage.getItem(MSG_KEY(user.id));
      if (raw) setMessages(JSON.parse(raw) as PetMessage[]);
    } catch {}
  }, [user]);

  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const spentPct   = income > 0 ? (totalSpent / income) * 100 : 0;
  const petState: PetState = spentPct < 50 ? "happy" : spentPct < 80 ? "content" : spentPct <= 100 ? "worried" : "sad";
  const happiness  = Math.max(0, Math.round(100 - spentPct));
  const cfg        = STATE_CONFIG[petState];

  useEffect(() => {
    if (loading || !user) return;
    const msg: PetMessage = {
      text: petData[cheerMode ? "happy" : petState],
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      state: cheerMode ? "happy" : petState,
    };
    setMessages(prev => {
      const updated = [msg, ...prev.filter(m => m.date !== msg.date)].slice(0, 3);
      try { localStorage.setItem(MSG_KEY(user.id), JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [loading, petState]);

  const uniqueDays = useMemo(() => {
    const days = new Set(expenses.map(e => e.created_at.slice(0, 10)));
    return days.size;
  }, [expenses]);

  const streak = useMemo(() => {
    if (expenses.length === 0) return 0;
    const days = [...new Set(expenses.map(e => e.created_at.slice(0, 10)))].sort((a, b) => b.localeCompare(a));
    let count = 0;
    let check = new Date();
    for (const day of days) {
      const d = new Date(day);
      const diff = Math.round((check.getTime() - d.getTime()) / 86400000);
      if (diff <= 1) { count++; check = d; }
      else break;
    }
    return count;
  }, [expenses]);

  const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

  function handleCheerUp() {
    const tip = CHEER_TIPS[Math.floor(Math.random() * CHEER_TIPS.length)]!;
    setCheerTip(tip);
    setCheerMode(true);
    setCheerAnim(true);
    setTimeout(() => setCheerAnim(false), 2000);
    setTimeout(() => setCheerMode(false), 8000);
  }

  const displayState: PetState = cheerAnim ? "happy" : petState;
  const displayCfg = STATE_CONFIG[displayState];
  const animClass = cheerAnim ? "pet-bounce" : cfg.animClass;

  const MOOD_STATE_COLORS: Record<PetState, string> = {
    happy: "#34D399", content: "#60A5FA", worried: "#FBBF24", sad: "#F87171",
  };

  return (
    <>
      <style>{`
        @keyframes pet-bounce-kf {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-18px); }
          60% { transform: translateY(-10px); }
        }
        @keyframes pet-sway-kf {
          0%, 100% { transform: rotate(0deg); }
          30% { transform: rotate(4deg); }
          70% { transform: rotate(-4deg); }
        }
        @keyframes pet-shake-kf {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes pet-droop-kf {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(6px) scaleY(0.95); }
        }
        @keyframes rain-fall {
          0% { transform: translateY(-20px); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(60px); opacity: 0; }
        }
        .pet-bounce { animation: pet-bounce-kf 1s ease-in-out infinite; }
        .pet-sway   { animation: pet-sway-kf 2.5s ease-in-out infinite; }
        .pet-shake  { animation: pet-shake-kf 0.5s ease-in-out infinite; }
        .pet-droop  { animation: pet-droop-kf 2s ease-in-out infinite; }
      `}</style>

      <div className="p-5 pt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">

        {/* ── 1. PET HERO ──────────────────────────────────────────── */}
        <div className="glass-card p-6 flex flex-col items-center gap-5 rounded-3xl">

          {/* Pet avatar */}
          <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
            <div className="absolute inset-0 rounded-full transition-all duration-1000"
              style={{ boxShadow: displayCfg.aura, background: displayCfg.bg, borderRadius: "50%" }} />

            {/* Rain cloud */}
            {cfg.raincloud && !cheerAnim && !loading && (
              <>
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl">🌧️</span>
                <RainDrop style={{ top: 10, left: "35%", fontSize: 12, animationDelay: "0s" }} />
                <RainDrop style={{ top: 10, left: "50%", fontSize: 10, animationDelay: "0.4s" }} />
                <RainDrop style={{ top: 10, left: "65%", fontSize: 12, animationDelay: "0.8s" }} />
              </>
            )}

            {/* Sparkles (happy) */}
            {displayCfg.sparkles && !loading && (
              <>
                <Sparkle style={{ top: 8,   left: 16,  fontSize: 22, animationDelay: "0s",   animationDuration: "1.4s" }} />
                <Sparkle style={{ top: 4,   right: 20, fontSize: 15, animationDelay: "0.4s", animationDuration: "1.8s" }} />
                <Sparkle style={{ bottom: 14, left: 8, fontSize: 18, animationDelay: "0.8s", animationDuration: "1.6s" }} />
                <Sparkle style={{ bottom: 6, right: 12, fontSize: 24, animationDelay: "0.2s",animationDuration: "2s"   }} />
                <Sparkle style={{ top: "30%", left: -4, fontSize: 13, animationDelay: "1s",  animationDuration: "1.5s" }} />
                <Sparkle style={{ top: "40%", right: -4,fontSize: 19, animationDelay: "0.6s",animationDuration: "1.9s" }} />
              </>
            )}

            {/* Pet emoji - BIG */}
            <div className={`relative w-36 h-36 rounded-full bg-white/50 border-4 border-white flex items-center justify-center ${animClass}`} style={{ zIndex: 1 }}>
              <span className="text-8xl select-none">{petData.emoji}</span>
            </div>

            {/* Mood badge */}
            {!loading && (
              <div className="absolute -bottom-1 -right-2 z-10 w-11 h-11 rounded-full bg-white/90 border-2 border-white shadow-md flex items-center justify-center text-2xl">
                {displayCfg.icon}
              </div>
            )}
          </div>

          {/* Name + mood */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold font-serif text-foreground">{petData.name}</h2>
            <div className="chrome-badge px-4 py-1.5 text-xs font-bold inline-block" style={{ color: displayCfg.moodColor }}>
              {loading ? "checking vibes..." : displayCfg.label}
            </div>
          </div>

          {/* Speech bubble */}
          {!loading && (
            <div className="relative w-full max-w-xs">
              <div className="glass-card px-5 py-4 text-center rounded-2xl relative" style={{ borderColor: `${displayCfg.moodColor}40` }}>
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{ borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: "10px solid rgba(255,255,255,0.7)" }} />
                <p className="text-sm font-medium text-foreground leading-relaxed italic">
                  "{petData[cheerAnim ? "happy" : petState]}"
                </p>
              </div>
            </div>
          )}

          {/* Cheer Up button */}
          {!loading && (petState === "sad" || petState === "worried") && !cheerMode && (
            <button
              onClick={handleCheerUp}
              className="gradient-btn px-6 py-3 text-sm font-extrabold text-white rounded-full"
              style={{ background: "linear-gradient(135deg, #FF6B9D, #B06EFF)" }}
            >
              cheer up {petData.name}! 💝
            </button>
          )}

          {/* Cheer tip */}
          {cheerMode && cheerTip && (
            <div className="w-full glass-card px-4 py-3 rounded-2xl text-center space-y-1"
              style={{ border: "1.5px solid rgba(52,211,153,0.35)", background: "rgba(52,211,153,0.08)" }}>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">💡 motivational tip</p>
              <p className="text-xs text-foreground leading-relaxed">{cheerTip}</p>
            </div>
          )}

          {/* ── 2. HAPPINESS METER ─────────────────────────────────── */}
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs font-semibold items-center">
              <span className="text-muted-foreground">{petData.name.toLowerCase()}'s happiness 🐾</span>
              {loading
                ? <div className="w-10 h-3 bg-white/40 rounded-full animate-pulse" />
                : <span style={{ color: displayCfg.moodColor }}>{happiness}%</span>
              }
            </div>
            <div className="w-full h-5 bg-white/40 rounded-full overflow-hidden border border-white/60 relative">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{
                  width: animBar && !loading ? `${Math.max(4, happiness)}%` : "0%",
                  background: displayCfg.barColor,
                  boxShadow: `0 0 10px ${displayCfg.moodColor}60`,
                }}
              >
                <div className="absolute inset-0 shimmer" />
              </div>
              {/* Paw print markers */}
              {[25, 50, 75].map(pos => (
                <span key={pos} className="absolute top-1/2 -translate-y-1/2 text-[8px] opacity-40 pointer-events-none select-none"
                  style={{ left: `${pos}%`, transform: "translateX(-50%) translateY(-50%)" }}>🐾</span>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>{loading ? "..." : `${INR(totalSpent)} spent`}</span>
              <span>{income > 0 ? `${INR(income)} budget` : "no budget set"}</span>
            </div>
          </div>
        </div>

        {/* ── 3. PET STATS ──────────────────────────────────────────── */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "days you made me happy 🌟", value: uniqueDays, color: "#34D399" },
              { label: "times you overspent 😅",    value: totalSpent > income && income > 0 ? 1 : 0, color: "#F87171" },
              { label: "current streak 🔥",         value: streak, color: "#FBBF24" },
            ].map(stat => (
              <div key={stat.label} className="glass-card p-4 rounded-2xl text-center space-y-2">
                <p className="text-2xl font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[9px] text-muted-foreground font-medium leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── 4. PET MESSAGE HISTORY ────────────────────────────────── */}
        {!loading && messages.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-extrabold font-serif gradient-text">{petData.name}'s messages 💌</h2>
            <div className="space-y-2.5">
              {messages.map((msg, i) => (
                <div key={i} className="flex gap-3 items-end">
                  <div className="w-8 h-8 rounded-full bg-white/50 border border-white/70 flex items-center justify-center text-lg flex-shrink-0">
                    {petData.emoji}
                  </div>
                  <div className="flex-1">
                    <div
                      className="glass-card px-4 py-2.5 rounded-2xl rounded-bl-sm text-xs text-foreground leading-relaxed italic"
                      style={{ borderColor: `${MOOD_STATE_COLORS[msg.state]}30` }}
                    >
                      "{msg.text}"
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1 ml-2">{msg.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Pet tip ──────────────────────────────────────────────── */}
        {!loading && (
          <div className="glass-card p-5 space-y-2 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">{petData.emoji}</span>
              <p className="text-sm font-bold text-foreground">{petData.name}'s tip 💡</p>
            </div>
            {petState === "happy"   && <p className="text-xs text-muted-foreground">You're under 50% of your budget with time left — consider adding extra to a savings goal! ⭐</p>}
            {petState === "content" && <p className="text-xs text-muted-foreground">Halfway there! Keep your daily spend in check and you'll end the month strong 💪</p>}
            {petState === "worried" && <p className="text-xs text-muted-foreground">You're over 80% of your budget. Try the 24-hour rule: wait a day before any non-essential purchase 🫶</p>}
            {petState === "sad"     && <p className="text-xs text-muted-foreground">Over budget this month — note what triggered the overspend and plan next month's budget around it 🌱</p>}
          </div>
        )}
      </div>
    </>
  );
}
