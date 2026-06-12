import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

const PET_MAP: Record<string, { emoji: string; name: string; species: string; personality: string }> = {
  luna:    { emoji: "🐱", name: "Luna",    species: "Cat",   personality: "quiet guardian of your coins 🌙" },
  mochi:   { emoji: "🐼", name: "Mochi",   species: "Panda", personality: "turns every saved rupee into a happy dance 🎋" },
  kitsune: { emoji: "🦊", name: "Kitsune", species: "Fox",   personality: "cunning with cash, loves a good deal ✨" },
  ribbit:  { emoji: "🐸", name: "Ribbit",  species: "Frog",  personality: "hops into action whenever you overspend 🍃" },
};

type Mood = { label: string; emoji: string; color: string; message: string };

function getMood(spentPct: number): Mood {
  if (spentPct < 50)  return { label: "Absolutely Thriving", emoji: "✨", color: "text-emerald-500", message: "You're crushing it! Your pet is literally glowing rn 🌟" };
  if (spentPct < 70)  return { label: "Chill & Happy",       emoji: "😊", color: "text-sky-500",     message: "Solid spending habits bestie — keep that vibe going 💅" };
  if (spentPct < 90)  return { label: "Getting Nervous",      emoji: "😅", color: "text-amber-500",   message: "Getting a little spenny in here… maybe slow down? 🫶" };
  return               { label: "Stressed Out",               emoji: "😰", color: "text-red-400",     message: "Budget is maxed! Your pet needs some financial therapy 💔" };
}

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function Pet() {
  const { user, profile } = useAuth();
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  const income = profile?.monthly_income ?? 0;
  const petData = PET_MAP[profile?.pet_choice ?? ""] ?? { emoji: "💰", name: "Buddy", species: "Coin", personality: "your financial companion" };
  const spentPct = income > 0 ? Math.min(100, (totalSpent / income) * 100) : 0;
  const mood = getMood(spentPct);
  const happinessPct = Math.max(0, 100 - spentPct);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth)
      .then(({ data }) => {
        setTotalSpent((data ?? []).reduce((s: number, e: { amount: number }) => s + e.amount, 0));
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="p-5 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-extrabold font-serif gradient-text">Your Financial Pet 🐾</h1>
        <p className="text-muted-foreground text-sm">their mood = your budget health 💕</p>
      </div>

      {/* Pet card */}
      <div className="glass-card p-8 flex flex-col items-center text-center space-y-5">
        {/* Pet avatar with mood glow */}
        <div className={`relative w-40 h-40 rounded-full bg-white/40 border-4 border-white flex items-center justify-center float
          ${spentPct < 70 ? "shadow-[0_0_50px_rgba(100,220,150,0.3)]" : spentPct < 90 ? "shadow-[0_0_50px_rgba(255,180,50,0.3)]" : "shadow-[0_0_50px_rgba(255,100,100,0.3)]"}`}>
          <span className="text-8xl">{petData.emoji}</span>
          <span className="absolute -bottom-2 -right-2 text-3xl animate-bounce">{mood.emoji}</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold font-serif text-foreground">{petData.name}</h2>
          <p className="text-xs text-muted-foreground">{petData.species} · {petData.personality}</p>
        </div>

        {/* Mood badge */}
        <div className={`chrome-badge px-4 py-1.5 font-bold text-xs ${mood.color}`}>
          {mood.label} {mood.emoji}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed px-2">{mood.message}</p>

        {/* Happiness bar */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">happiness</span>
            <span className={mood.color}>{Math.round(happinessPct)}%</span>
          </div>
          <div className="w-full h-3 bg-white/40 rounded-full overflow-hidden border border-white/60">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: loading ? "0%" : `${happinessPct}%`,
                background: spentPct < 70
                  ? "linear-gradient(90deg, #6EE7B7, #34D399)"
                  : spentPct < 90
                  ? "linear-gradient(90deg, #FDE68A, #F59E0B)"
                  : "linear-gradient(90deg, #FCA5A5, #EF4444)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 text-center space-y-1">
          <p className="text-2xl font-extrabold gradient-text">{formatINR(totalSpent)}</p>
          <p className="text-xs text-muted-foreground font-medium">spent this month</p>
        </div>
        <div className="glass-card p-4 text-center space-y-1">
          <p className="text-2xl font-extrabold gradient-text">{Math.round(100 - spentPct)}%</p>
          <p className="text-xs text-muted-foreground font-medium">budget remaining</p>
        </div>
      </div>

      {/* Tips */}
      <div className="glass-card p-5 space-y-3">
        <p className="text-sm font-bold text-foreground">{petData.name}'s tip for you 💡</p>
        {spentPct < 50 && <p className="text-xs text-muted-foreground">You're well within budget! Consider moving some savings to your goals ⭐</p>}
        {spentPct >= 50 && spentPct < 70 && <p className="text-xs text-muted-foreground">Halfway through your budget — you're doing great! Stay consistent ✨</p>}
        {spentPct >= 70 && spentPct < 90 && <p className="text-xs text-muted-foreground">Slow down a little! Try the 24-hour rule before non-essential purchases 🫶</p>}
        {spentPct >= 90 && <p className="text-xs text-muted-foreground">Budget's almost gone! Switch to essentials only for the rest of the month 🙏</p>}
      </div>
    </div>
  );
}
