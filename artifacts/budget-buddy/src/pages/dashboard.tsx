import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

// ─── helpers ──────────────────────────────────────────────────────────────────
const INR = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function dayLabel(iso: string) {
  const d = new Date(iso);
  return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
}

const CATEGORY_COLORS: Record<string, string> = {
  Food:"#FF6B9D", Transport:"#B06EFF", Shopping:"#FFB347",
  Education:"#60A5FA", Fun:"#34D399", Health:"#F87171", Other:"#A78BFA",
};
const CAT_ORDER = ["Food","Transport","Shopping","Education","Fun","Health","Other"];

// ─── skeleton ─────────────────────────────────────────────────────────────────
function Skel({ w = "w-full", h = "h-4", extra = "" }) {
  return <div className={`${w} ${h} ${extra} bg-white/40 rounded-full animate-pulse`} />;
}

// ─── types ────────────────────────────────────────────────────────────────────
type Expense = {
  id: string; amount: number; category: string; emoji: string;
  note: string | null; mood: string | null; created_at: string; date: string | null;
};
type Goal = { id: string; name: string; emoji: string; target_amount: number; current_amount: number };

// ─── custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs font-bold shadow-lg">
      <p className="text-muted-foreground">{label}</p>
      <p className="gradient-text text-sm">{INR(payload[0].value)}</p>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, profile } = useAuth();
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [goals, setGoals]         = useState<Goal[]>([]);
  const [loading, setLoading]     = useState(true);

  const now        = new Date();
  const monthName  = MONTH_NAMES[now.getMonth()];
  const income     = profile?.monthly_income ?? 0;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth  = now.getDate();

  // greeting name: profile.name → email prefix → "bestie"
  const firstName = (() => {
    const raw = (profile as any)?.name || user?.email?.split("@")[0] || "bestie";
    return raw.split(/[\s._]/)[0];
  })();

  useEffect(() => {
    if (!user) return;
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    Promise.all([
      supabase.from("expenses").select("*").eq("user_id", user.id)
        .gte("created_at", start).order("created_at", { ascending: false }),
      supabase.from("savings_goals").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: true }).limit(3),
    ]).then(([{ data: exp }, { data: gl }]) => {
      setExpenses((exp ?? []) as Expense[]);
      setGoals((gl ?? []) as Goal[]);
      setLoading(false);
    });
  }, [user]);

  // ── derived numbers ──────────────────────────────────────────────────────
  const totalSpent  = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const remaining   = Math.max(0, income - totalSpent);
  const spentPct    = income > 0 ? Math.min(100, (totalSpent / income) * 100) : 0;
  const dailyBudget = income / daysInMonth;
  const dailyAvg    = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
  const totalGoalSaved = goals.reduce((s, g) => s + g.current_amount, 0);

  // streak: consecutive days (backwards from yesterday) where spend ≤ daily budget
  const streak = useMemo(() => {
    const byDay: Record<string, number> = {};
    expenses.forEach(e => {
      const key = (e.date ?? e.created_at.split("T")[0]);
      byDay[key] = (byDay[key] ?? 0) + e.amount;
    });
    let s = 0;
    for (let d = 1; d <= dayOfMonth; d++) {
      const key = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      if ((byDay[key] ?? 0) <= dailyBudget) s++;
      else s = 0;
    }
    return s;
  }, [expenses, dailyBudget, dayOfMonth, now]);

  // by category
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount; });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({ cat, amt }));
  }, [expenses]);

  const topCatTotal = byCategory[0]?.amt ?? 1;

  // last 7 days bar chart
  const weekData = useMemo(() => {
    const days: { label: string; key: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push({ label: dayLabel(d.toISOString()), key, total: 0 });
    }
    expenses.forEach(e => {
      const key = e.date ?? e.created_at.split("T")[0];
      const slot = days.find(d => d.key === key);
      if (slot) slot.total += e.amount;
    });
    return days;
  }, [expenses, now]);

  const maxBar = Math.max(...weekData.map(d => d.total), 1);

  return (
    <div className="p-5 pt-10 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">

      {/* ── 1. Header ─────────────────────────────────────────────────── */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold font-serif text-foreground">
            hey {firstName} ✨
          </h1>
          <p className="text-muted-foreground text-sm font-medium">{monthName} budget overview</p>
        </div>
        <Link to="/pet" data-testid="link-pet-avatar"
          className="w-11 h-11 rounded-full bg-white/60 border-2 border-white flex items-center justify-center text-2xl shadow-sm hover:scale-110 transition-transform">
          {profile?.pet_choice === "luna" ? "🐱" : profile?.pet_choice === "mochi" ? "🐼" : profile?.pet_choice === "kitsune" ? "🦊" : profile?.pet_choice === "ribbit" ? "🐸" : "💰"}
        </Link>
      </div>

      {/* ── 2. Budget overview card ──────────────────────────────────── */}
      <div className="glass-card p-6 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skel w="w-3/4" h="h-10" />
            <Skel h="h-3" />
            <Skel w="w-1/2" h="h-3" />
          </div>
        ) : (
          <>
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">left this month</p>
              <p className="text-5xl font-extrabold font-serif leading-none" style={{
                background: "var(--gradient-primary)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                {INR(remaining)}
              </p>
            </div>

            {/* animated progress bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2.5 bg-white/40 rounded-full overflow-hidden border border-white/50">
                <div
                  className="h-full rounded-full shimmer transition-all duration-1000 ease-out"
                  style={{ width: `${spentPct}%`, background: "var(--gradient-primary)" }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>{INR(totalSpent)} spent</span>
                <span className="font-bold" style={{ color: spentPct > 85 ? "#F87171" : spentPct > 60 ? "#FBBF24" : "#34D399" }}>
                  {Math.round(spentPct)}%
                </span>
                <span>of {INR(income)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 3. Quick stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { icon: "📅", label: "daily avg",  value: loading ? null : INR(dailyAvg) },
          { icon: "🔥", label: "day streak", value: loading ? null : `${streak}d` },
          { icon: "💎", label: "saved",      value: loading ? null : INR(totalGoalSaved) },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-3.5 flex flex-col items-center text-center gap-1.5">
            <span className="text-xl">{stat.icon}</span>
            {stat.value == null
              ? <Skel w="w-12" h="h-5" extra="mx-auto" />
              : <p className="text-base font-extrabold gradient-text leading-none">{stat.value}</p>
            }
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── 4. Spending by category ──────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center px-0.5">
          <h2 className="text-sm font-bold text-foreground">Spending by Category</h2>
          {!loading && byCategory.length > 0 && (
            <span className="text-xs text-muted-foreground">{byCategory.length} categories</span>
          )}
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-hidden">
            {[1,2,3].map(i => (
              <div key={i} className="flex-shrink-0 glass-card p-4 w-32 space-y-2 animate-pulse">
                <Skel w="w-8" h="h-8" extra="rounded-full" />
                <Skel w="w-16" h="h-3" />
                <Skel h="h-2" />
              </div>
            ))}
          </div>
        ) : byCategory.length === 0 ? (
          <div className="glass-card p-5 text-center text-sm text-muted-foreground">
            no spending tracked yet — go log something! 💸
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {byCategory.map(({ cat, amt }) => {
              const pct = (amt / topCatTotal) * 100;
              const color = CATEGORY_COLORS[cat] ?? "#A78BFA";
              const emoji = { Food:"🍔", Transport:"🚌", Shopping:"🛍️", Education:"📚", Fun:"🎉", Health:"💊", Other:"✨" }[cat] ?? "💸";
              return (
                <div key={cat} className="flex-shrink-0 glass-card p-4 w-32 space-y-2 hover:scale-[1.03] transition-transform">
                  <div className="w-9 h-9 rounded-full bg-white/60 flex items-center justify-center text-xl border border-white/60">{emoji}</div>
                  <p className="text-xs font-bold text-foreground truncate">{cat}</p>
                  <p className="text-sm font-extrabold" style={{ color }}>{INR(amt)}</p>
                  <div className="h-1.5 w-full bg-white/40 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, opacity: 0.8 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 5. Weekly spending chart ─────────────────────────────────── */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-foreground">Last 7 Days</h2>
          {!loading && <span className="chrome-badge px-2 py-0.5">{INR(weekData.reduce((s,d)=>s+d.total,0))} total</span>}
        </div>

        {loading ? (
          <div className="flex items-end gap-2 h-28">
            {[60,80,40,100,70,50,90].map((h,i) => (
              <div key={i} className="flex-1 rounded-t-lg bg-white/30 animate-pulse" style={{ height: `${h}%` }} />
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weekData} barCategoryGap="25%">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B06EFF" />
                  <stop offset="100%" stopColor="#FF6B9D" />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.15)", radius: 8 }} />
              <Bar dataKey="total" radius={[6,6,0,0]} maxBarSize={36}>
                {weekData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.total === maxBar ? "url(#barGrad)" : "rgba(176,110,255,0.35)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── 6. Recent expenses ───────────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center px-0.5">
          <h2 className="text-sm font-bold text-foreground">Recent Expenses 💸</h2>
          {expenses.length > 5 && (
            <Link to="/insights" className="text-xs text-primary font-bold hover:underline">view all →</Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="glass-card p-3.5 flex items-center gap-3 animate-pulse">
                <Skel w="w-10" h="h-10" extra="rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2"><Skel w="w-28" /><Skel w="w-20" h="h-3" /></div>
                <Skel w="w-14" />
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="glass-card p-8 flex flex-col items-center gap-2 text-center">
            <span className="text-4xl">🌸</span>
            <p className="text-sm font-semibold text-foreground">no expenses yet!</p>
            <Link to="/add" className="gradient-btn px-5 py-2 text-sm mt-1">+ Add one ✨</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.slice(0, 5).map(exp => {
              const moodEmoji: Record<string,string> = {
                Happy:"😊", Sad:"😔", Bored:"😴", Stressed:"😡", Excited:"🤩"
              };
              const ago = (() => {
                const diff = Date.now() - new Date(exp.created_at).getTime();
                const m = Math.floor(diff/60000);
                if (m < 60) return `${m}m ago`;
                const h = Math.floor(m/60);
                if (h < 24) return `${h}h ago`;
                return `${Math.floor(h/24)}d ago`;
              })();
              return (
                <div key={exp.id} className="glass-card p-3.5 flex items-center justify-between gap-3 hover:scale-[1.01] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-white/60 border border-white/70 flex items-center justify-center text-lg">
                      {exp.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-foreground text-sm">{exp.category}</p>
                        {exp.mood && <span className="text-xs">{moodEmoji[exp.mood] ?? ""}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{exp.note ? `${exp.note} · ` : ""}{ago}</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-foreground flex-shrink-0">-{INR(exp.amount)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 7. Savings goal preview ──────────────────────────────────── */}
      {(loading || goals.length > 0) && (
        <div className="space-y-2.5">
          <div className="flex justify-between items-center px-0.5">
            <h2 className="text-sm font-bold text-foreground">Savings Goals ⭐</h2>
            <Link to="/goals" className="text-xs text-primary font-bold hover:underline">manage →</Link>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="glass-card p-4 space-y-3 animate-pulse">
                <div className="flex justify-between"><Skel w="w-28" /><Skel w="w-10" /></div>
                <Skel h="h-2.5" />
                <div className="flex justify-between"><Skel w="w-20" h="h-3" /><Skel w="w-20" h="h-3" /></div>
              </div>
            ) : (
              goals.map(goal => {
                const pct = goal.target_amount > 0
                  ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
                const done = pct >= 100;
                return (
                  <div key={goal.id} className="glass-card p-4 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{goal.emoji}</span>
                        <span className="font-bold text-sm text-foreground">{goal.name}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: done ? "#34D399" : "hsl(var(--primary))" }}>
                        {Math.round(pct)}%{done ? " 🎉" : ""}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: done ? "linear-gradient(90deg,#6EE7B7,#34D399)" : "var(--gradient-primary)",
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>{INR(goal.current_amount)} saved</span>
                      <span>goal: {INR(goal.target_amount)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
