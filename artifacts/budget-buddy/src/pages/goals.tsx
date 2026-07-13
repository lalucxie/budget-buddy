import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase, type SavingsGoal } from "@/lib/supabase";

// ─── helpers ──────────────────────────────────────────────────────────────────
const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const GOAL_EMOJIS = ["🎧","👟","✈️","💻","🎮","👜","📱","🎸","🌴","💄","🎓","🐾"];

type Expense = {
  amount: number; category: string; mood: string | null;
  created_at: string; date: string | null;
};

function scoreTitle(s: number) {
  if (s >= 90) return "Finance Legend 🏆";
  if (s >= 70) return "Smart Cookie 🍪";
  if (s >= 50) return "Getting There 📈";
  return "Let's Glow Up 💪";
}
function scoreColor(s: number) {
  if (s >= 90) return "#FFD700";
  if (s >= 70) return "#34D399";
  if (s >= 50) return "#60A5FA";
  return "#F87171";
}

// ─── Circular progress ────────────────────────────────────────────────────────
function CircularProgress({ pct, size = 160, emoji, name }: {
  pct: number; size?: number; emoji: string; name: string;
}) {
  const r = size * 0.38;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id={`circGrad-${name}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF6B9D" />
              <stop offset="100%" stopColor="#B06EFF" />
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r}
            stroke="rgba(255,255,255,0.4)" strokeWidth={size * 0.09} fill="none" />
          <circle
            cx={cx} cy={cy} r={r}
            stroke={`url(#circGrad-${name})`}
            strokeWidth={size * 0.09}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.2,0.64,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-3xl">{emoji}</span>
          <span className="text-xl font-extrabold gradient-text leading-none">{Math.round(pct)}%</span>
          <span className="font-accent text-base text-muted-foreground uppercase tracking-wide">saved</span>
        </div>
      </div>
      <p className="font-bold text-foreground text-sm text-center">{name}</p>
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ icon, label, score, delay = 0 }: {
  icon: string; label: string; score: number; delay?: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(score), 50 + delay);
    return () => clearTimeout(t);
  }, [score, delay]);
  const c = scoreColor(score);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
          <span>{icon}</span>{label}
        </span>
        <span className="text-sm font-extrabold" style={{ color: c }}>{score}</span>
      </div>
      <div className="h-2.5 w-full bg-white/30 rounded-full overflow-hidden border border-white/40">
        <div
          className="h-full rounded-full"
          style={{
            width: `${w}%`,
            background: `linear-gradient(90deg, ${c}99, ${c})`,
            transition: `width 1s cubic-bezier(0.34,1.2,0.64,1) ${delay}ms`,
            boxShadow: `0 0 8px ${c}60`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ w = "w-full", h = "h-4", extra = "" }) {
  return <div className={`${w} ${h} ${extra} bg-white/40 rounded-full animate-pulse`} />;
}

// ─── Add money modal ──────────────────────────────────────────────────────────
function AddMoneyModal({ goal, onClose, onSaved }: {
  goal: SavingsGoal; onClose: () => void; onSaved: () => void;
}) {
  const [amt, setAmt] = useState("");
  const [saving, setSaving] = useState(false);
  const left = Math.max(0, goal.target_amount - goal.current_amount);

  async function handleSave() {
    const n = parseFloat(amt);
    if (!n || n <= 0) return;
    setSaving(true);
    const newAmt = Math.min(goal.target_amount, goal.current_amount + n);
    await supabase.from("savings_goals").update({ current_amount: newAmt }).eq("id", goal.id);
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[420px] glass-card p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-extrabold text-foreground text-base">
              adding to {goal.emoji} {goal.name}
            </h3>
            <p className="font-accent text-base text-muted-foreground">{INR(left)} more to hit the goal</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none ml-3">✕</button>
        </div>

        <div className="flex items-center gap-2 bg-white/60 border-2 border-white/70 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/40 transition-all">
          <span className="text-xl font-bold text-muted-foreground">₹</span>
          <input
            data-testid="input-add-money"
            type="number"
            value={amt}
            onChange={e => setAmt(e.target.value)}
            placeholder="0"
            min="1"
            autoFocus
            className="flex-1 text-2xl font-extrabold bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground/30"
            onKeyDown={e => e.key === "Enter" && handleSave()}
          />
        </div>

        <div className="flex gap-2">
          {[500, 1000, 2000].map(preset => (
            <button
              key={preset}
              onClick={() => setAmt(String(Math.min(preset, left)))}
              className="flex-1 py-2 rounded-full border-2 border-white/60 bg-white/40 text-xs font-bold text-muted-foreground hover:bg-white/70 hover:text-foreground transition-all"
            >
              +{INR(preset)}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!amt || parseFloat(amt) <= 0 || saving}
          className="w-full gradient-btn py-3.5 text-base font-bold disabled:opacity-40"
        >
          {saving ? "saving... ✨" : "add to savings 💎"}
        </button>
      </div>
    </div>
  );
}

// ─── New goal form ────────────────────────────────────────────────────────────
function NewGoalForm({ userId, onSaved, onClose }: {
  userId: string; onSaved: () => void; onClose: () => void;
}) {
  const [name, setName]     = useState("");
  const [target, setTarget] = useState("");
  const [emoji, setEmoji]   = useState("🎧");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name || !target) return;
    setSaving(true);
    await supabase.from("savings_goals").insert({
      user_id: userId, name,
      target_amount: parseFloat(target) || 0,
      current_amount: 0, emoji,
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="glass-card p-5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 border-2 border-pink-200/60">
      <div className="flex justify-between items-center">
        <p className="font-bold text-sm text-foreground">new goal ✨</p>
        <button onClick={onClose} className="text-muted-foreground text-lg leading-none">✕</button>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">what are you saving for?</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. New Laptop 💻"
          className="w-full bg-white/60 border border-white/80 rounded-2xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground/60" />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">how much does it cost?</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
          <input type="number" value={target} onChange={e => setTarget(e.target.value)}
            placeholder="0" min="0"
            className="w-full bg-white/60 border border-white/80 rounded-2xl pl-8 pr-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">pick a vibe</label>
        <div className="flex flex-wrap gap-2">
          {GOAL_EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)}
              className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all ${
                emoji === e
                  ? "bg-white border-pink-400 scale-110 shadow-md"
                  : "bg-white/40 border-white/60 hover:scale-105"
              }`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-full border-2 border-white/60 bg-white/40 text-sm font-semibold text-muted-foreground">
          cancel
        </button>
        <button onClick={handleSave} disabled={!name || !target || saving}
          className="flex-[2] gradient-btn py-2.5 text-sm disabled:opacity-40">
          {saving ? "saving..." : "create goal ✨"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Goals() {
  const { user, profile } = useAuth();
  const [goals, setGoals]           = useState<SavingsGoal[]>([]);
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [loading, setLoading]       = useState(true);
  const [addMoneyTo, setAddMoneyTo] = useState<SavingsGoal | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [copied, setCopied]         = useState(false);

  const income = profile?.monthly_income ?? 0;

  function load() {
    if (!user) return;
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    Promise.all([
      supabase.from("savings_goals").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase.from("expenses")
        .select("amount,category,mood,created_at,date")
        .eq("user_id", user.id).gte("created_at", start),
    ]).then(([{ data: g }, { data: e }]) => {
      setGoals((g ?? []) as SavingsGoal[]);
      setExpenses((e ?? []) as Expense[]);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, [user]);

  // ── Score calculation ──────────────────────────────────────────────────────
  const scores = useMemo(() => {
    const now         = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth  = now.getDate();
    const dailyBudget = income / daysInMonth;

    const byDay: Record<string, number> = {};
    expenses.forEach(e => {
      const key = e.date ?? e.created_at.split("T")[0];
      byDay[key] = (byDay[key] ?? 0) + e.amount;
    });
    const daysTracked   = Object.keys(byDay).length;
    const daysUnder     = Object.values(byDay).filter(d => d <= dailyBudget).length;
    const budgetControl = daysTracked > 0
      ? Math.round((daysUnder / Math.min(daysTracked, dayOfMonth)) * 100)
      : income > 0 ? 80 : 50;

    const savingsHabit = goals.length > 0
      ? Math.round(
          goals.reduce((s, g) =>
            s + Math.min(100, g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0), 0
          ) / goals.length
        )
      : 40;

    const mooded        = expenses.filter(e => e.mood);
    const impulsive     = mooded.filter(e => e.mood === "Bored" || e.mood === "Stressed").length;
    const impulseControl = mooded.length > 0
      ? Math.round((1 - impulsive / mooded.length) * 100)
      : 75;

    const overall = Math.round((budgetControl + savingsHabit + impulseControl) / 3);
    return { budgetControl, savingsHabit, impulseControl, overall };
  }, [expenses, goals, income]);

  function handleShare() {
    const title = scoreTitle(scores.overall);
    navigator.clipboard.writeText(
      `My Budget Buddy Adulting Score: ${scores.overall}/100 — ${title} 🎓\n` +
      `Budget Control: ${scores.budgetControl} | Savings: ${scores.savingsHabit} | Impulse Control: ${scores.impulseControl}\n` +
      `#BudgetBuddy #StudentLife`
    ).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="p-5 pt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">

      {/* ── SECTION 1: Savings Goals ───────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold font-serif gradient-text">your goals 💎</h1>
            <p className="font-accent text-base text-muted-foreground">imagine already having it. now let's make it real.</p>
          </div>
          <button
            data-testid="button-new-goal"
            onClick={() => setShowNewForm(v => !v)}
            className="gradient-btn px-4 py-2 text-sm"
          >
            {showNewForm ? "✕ close" : "+ new"}
          </button>
        </div>

        {showNewForm && user && (
          <NewGoalForm userId={user.id} onSaved={load} onClose={() => setShowNewForm(false)} />
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="glass-card p-6 flex flex-col items-center gap-4 animate-pulse">
                <div className="w-40 h-40 rounded-full bg-white/30" />
                <Skel w="w-32" h="h-4" />
                <Skel w="w-48" h="h-3" />
              </div>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="glass-card p-10 flex flex-col items-center text-center gap-3">
            <span className="text-5xl float inline-block">🌱</span>
            <p className="font-bold text-foreground">nothing here yet</p>
            <p className="font-accent text-lg text-muted-foreground">every glow up starts somewhere ✨</p>
            <button onClick={() => setShowNewForm(true)}
              className="gradient-btn px-6 py-3 text-sm mt-1">
              + add first goal
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => {
              const pct  = goal.target_amount > 0
                ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
              const left = Math.max(0, goal.target_amount - goal.current_amount);
              const done = pct >= 100;
              return (
                <div key={goal.id} data-testid={`goal-${goal.id}`} className="glass-card p-6 flex flex-col items-center gap-4">
                  <CircularProgress pct={pct} size={160} emoji={goal.emoji} name={goal.name} />

                  <div className="text-center space-y-1 w-full">
                    {done ? (
                      <p className="font-extrabold text-emerald-500 text-sm">
                        you absolutely slayed this one! 🎉
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-muted-foreground">
                        <span className="gradient-text font-extrabold">{INR(left)} more</span> to go — you got this 💪
                      </p>
                    )}
                    <div className="flex justify-center gap-4 text-xs text-muted-foreground font-medium">
                      <span>{INR(goal.current_amount)} saved</span>
                      <span>·</span>
                      <span>goal: {INR(goal.target_amount)}</span>
                    </div>
                  </div>

                  {done ? (
                    <div className="w-full py-2.5 rounded-full text-center text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200">
                      completed 🎉
                    </div>
                  ) : (
                    <button
                      data-testid={`button-add-money-${goal.id}`}
                      onClick={() => setAddMoneyTo(goal)}
                      className="w-full gradient-btn py-3 text-sm font-bold"
                    >
                      + add savings 💎
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 2: Adulting Score ──────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold font-serif gradient-text">adulting score 🎓</h2>
          <p className="font-accent text-base text-muted-foreground">how well are you holding it together this month?</p>
        </div>

        <div className="holo-card relative overflow-hidden rounded-3xl p-6 space-y-5">
          <div className="holo-overlay absolute inset-0 rounded-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-2 py-2">
            {loading ? (
              <div className="space-y-2 flex flex-col items-center w-full">
                <Skel w="w-24" h="h-16" extra="rounded-2xl mx-auto" />
                <Skel w="w-36" h="h-5" extra="mx-auto" />
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <span
                    className="text-7xl font-extrabold font-serif leading-none"
                    style={{
                      color: scoreColor(scores.overall),
                      textShadow: `0 0 30px ${scoreColor(scores.overall)}80, 0 0 60px ${scoreColor(scores.overall)}40`,
                    }}
                  >
                    {scores.overall}
                  </span>
                  <span className="text-2xl font-bold text-white/70 mb-2">/ 100</span>
                </div>
                <div className="chrome-badge px-4 py-1.5 text-sm font-bold tracking-wide">
                  {scoreTitle(scores.overall)}
                </div>
              </>
            )}
          </div>

          <div className="relative z-10 space-y-3 bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-1.5">
                    <Skel />
                    <Skel h="h-2.5" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <ScoreBar icon="💰" label="Budget Control"  score={scores.budgetControl}  delay={0}   />
                <ScoreBar icon="💎" label="Savings Habit"   score={scores.savingsHabit}   delay={150} />
                <ScoreBar icon="⚡" label="Impulse Control" score={scores.impulseControl} delay={300} />
              </>
            )}
          </div>

          {!loading && (
            <div className="relative z-10 space-y-0.5 px-1">
              <p className="text-[11px] text-white/80 font-accent text-sm">💰 days you stayed within your daily budget</p>
              <p className="text-[11px] text-white/80 font-accent text-sm">💎 average progress across your savings goals</p>
              <p className="text-[11px] text-white/80 font-accent text-sm">⚡ purchases made when you weren't bored or stressed</p>
            </div>
          )}

          <button
            data-testid="button-share-score"
            onClick={handleShare}
            disabled={loading}
            className="relative z-10 w-full py-3 rounded-full border-2 border-white/50 bg-white/20 backdrop-blur-sm text-white font-bold text-sm hover:bg-white/30 transition-all disabled:opacity-40 active:scale-95"
          >
            {copied ? "copied! share it 🎉" : "share your score 📤"}
          </button>
        </div>

        {!loading && (
          <div className="glass-card p-4 space-y-2">
            <p className="text-xs font-bold text-foreground">level up tips 💡</p>
            {scores.budgetControl < 70 && (
              <p className="font-accent text-base text-muted-foreground">
                · spend under {INR(income / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())} per day to boost your Budget Control
              </p>
            )}
            {scores.savingsHabit < 70 && (
              <p className="font-accent text-base text-muted-foreground">
                · add money to your goals regularly to build that Savings Habit
              </p>
            )}
            {scores.impulseControl < 70 && (
              <p className="font-accent text-base text-muted-foreground">
                · next time you're bored or stressed, wait 10 minutes before spending
              </p>
            )}
            {scores.budgetControl >= 70 && scores.savingsHabit >= 70 && scores.impulseControl >= 70 && (
              <p className="font-accent text-base text-muted-foreground">
                · honestly? you're winning at adulting rn 🏆 keep it up!
              </p>
            )}
          </div>
        )}
      </div>

      {addMoneyTo && (
        <AddMoneyModal
          goal={addMoneyTo}
          onClose={() => setAddMoneyTo(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
