import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterPeriod = "weekly" | "monthly" | "quarterly" | "half-yearly" | "yearly";
type Expense = {
  id: string; amount: number; category: string; emoji: string;
  note: string | null; mood: string | null; created_at: string; date: string | null;
};
type Goal = { id: string; name: string; emoji: string; target_amount: number; current_amount: number };

// ─── Constants ────────────────────────────────────────────────────────────────
const FILTERS: { key: FilterPeriod; label: string }[] = [
  { key: "weekly",      label: "Weekly"      },
  { key: "monthly",     label: "Monthly"     },
  { key: "quarterly",   label: "Quarterly"   },
  { key: "half-yearly", label: "Half Yearly" },
  { key: "yearly",      label: "Yearly"      },
];

const FILTER_DAYS: Record<FilterPeriod, number> = {
  weekly: 7, monthly: 30, quarterly: 90, "half-yearly": 180, yearly: 365,
};

const CAT_COLORS: Record<string, string> = {
  Food: "#FF6B9D", Transport: "#B06EFF", Shopping: "#FFB347",
  Coffee: "#A78BFA", Study: "#60A5FA", Fun: "#34D399", Health: "#F87171", Other: "#94A3B8",
};
const CAT_EMOJI: Record<string, string> = {
  Food: "🍔", Transport: "🚌", Shopping: "🛍️", Coffee: "☕",
  Study: "📚", Fun: "🎮", Health: "💊", Other: "💸",
};
const MOOD_EMOJI: Record<string, string> = {
  Happy: "😊", Stressed: "😓", Bored: "😐", Treating: "🥳", Necessary: "📌",
};

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const TX_PER_PAGE = 10;

// ─── Date helpers ─────────────────────────────────────────────────────────────
function getPeriodStart(period: FilterPeriod): Date {
  const d = new Date();
  d.setDate(d.getDate() - FILTER_DAYS[period]);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getPrevPeriodRange(period: FilterPeriod): { start: Date; end: Date } {
  const days = FILTER_DAYS[period];
  const end = new Date();
  end.setDate(end.getDate() - days);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

// ─── Chart data builders ──────────────────────────────────────────────────────
function buildTrendData(expenses: Expense[], period: FilterPeriod) {
  const now = new Date();
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (period === "weekly") {
    const buckets: { label: string; key: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      buckets.push({ label: DAY_NAMES[d.getDay()]!, key: d.toISOString().split("T")[0]!, amount: 0 });
    }
    expenses.forEach(e => {
      const key = e.date ?? e.created_at.split("T")[0]!;
      const s = buckets.find(b => b.key === key);
      if (s) s.amount += e.amount;
    });
    return buckets.map(({ label, amount }) => ({ label, amount }));
  }

  if (period === "monthly") {
    const buckets: { label: string; key: string; amount: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const key = d.toISOString().split("T")[0]!;
      buckets.push({ label: `${d.getDate()}`, key, amount: 0 });
    }
    expenses.forEach(e => {
      const key = e.date ?? e.created_at.split("T")[0]!;
      const s = buckets.find(b => b.key === key);
      if (s) s.amount += e.amount;
    });
    // Downsample: show every 3rd label to avoid crowding
    return buckets.map((b, i) => ({ ...b, label: i % 3 === 0 ? b.label : "" }));
  }

  // Quarterly, Half-yearly, Yearly → monthly buckets
  const monthCount = period === "quarterly" ? 3 : period === "half-yearly" ? 6 : 12;
  const months: { label: string; key: string; amount: number }[] = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ label: d.toLocaleString("default", { month: "short" }), key, amount: 0 });
  }
  expenses.forEach(e => {
    const key = e.created_at.slice(0, 7);
    const s = months.find(m => m.key === key);
    if (s) s.amount += e.amount;
  });
  return months.map(({ label, amount }) => ({ label, amount }));
}

function buildIncomeVsSpend(expenses: Expense[], period: FilterPeriod, monthlyIncome: number) {
  const now = new Date();
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (period === "weekly") {
    const dailyIncome = monthlyIncome / 30;
    const buckets: { label: string; key: string; income: number; spending: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      buckets.push({ label: DAY_NAMES[d.getDay()]!, key: d.toISOString().split("T")[0]!, income: dailyIncome, spending: 0 });
    }
    expenses.forEach(e => {
      const key = e.date ?? e.created_at.split("T")[0]!;
      const s = buckets.find(b => b.key === key);
      if (s) s.spending += e.amount;
    });
    return buckets.map(({ label, income, spending }) => ({ label, income, spending }));
  }

  const monthCount = period === "monthly" ? 4 : period === "quarterly" ? 3 : period === "half-yearly" ? 6 : 12;
  const months: { label: string; key: string; income: number; spending: number }[] = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ label: d.toLocaleString("default", { month: "short" }), key, income: monthlyIncome, spending: 0 });
  }
  expenses.forEach(e => {
    const key = e.created_at.slice(0, 7);
    const s = months.find(m => m.key === key);
    if (s) s.spending += e.amount;
  });
  return months.map(({ label, income, spending }) => ({ label, income, spending }));
}

// ─── Reusable pieces ──────────────────────────────────────────────────────────
function Skel({ w = "w-full", h = "h-4", extra = "" }: { w?: string; h?: string; extra?: string }) {
  return <div className={`${w} ${h} ${extra} bg-white/40 rounded-full animate-pulse`} />;
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs font-bold shadow-lg" style={{ zIndex: 50 }}>
      {label && <p className="text-muted-foreground mb-0.5">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color ?? p.fill }}>{p.name ?? p.dataKey}: {INR(p.value)}</p>
      ))}
    </div>
  );
}

function SavingsRing({ pct, saved, target }: { pct: number; saved: number; target: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, pct) / 100);
  const good = pct >= 80;
  const mid  = pct >= 50;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="dash-ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={good ? "#34D399" : mid ? "#60A5FA" : "#B06EFF"} />
              <stop offset="100%" stopColor={good ? "#6EE7B7" : mid ? "#93C5FD" : "#FF6B9D"} />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="13" />
          <circle cx="60" cy="60" r={r} fill="none" stroke="url(#dash-ring-grad)" strokeWidth="13"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-extrabold gradient-text leading-none">{Math.round(pct)}%</p>
          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">of goal</p>
        </div>
      </div>
      <div className="text-center space-y-0.5">
        <p className="text-sm font-bold text-foreground">saved {INR(saved)} of {INR(target)}</p>
        {target > saved && (
          <p className="text-xs text-muted-foreground">{INR(target - saved)} more to go! 💎</p>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, profile } = useAuth();
  const [filter, setFilter]         = useState<FilterPeriod>("monthly");
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [prevAmt, setPrevAmt]       = useState<number>(0);
  const [goals, setGoals]           = useState<Goal[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeCat, setActiveCat]   = useState<number | null>(null);

  // Transaction filters
  const [txSearch, setTxSearch]     = useState("");
  const [txCategory, setTxCategory] = useState<string | null>(null);
  const [txMood, setTxMood]         = useState<string | null>(null);
  const [txSort, setTxSort]         = useState<"date" | "amount" | "category">("date");
  const [txPage, setTxPage]         = useState(1);

  const income = profile?.monthly_income ?? 0;
  const firstName = (() => {
    const raw = (profile as any)?.name || user?.email?.split("@")[0] || "bestie";
    return raw.split(/[\s._]/)[0];
  })();

  const petEmoji = { luna: "🐱", mochi: "🐼", kitsune: "🦊", ribbit: "🐸" }[profile?.pet_choice ?? ""] ?? "💰";

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setActiveCat(null);
    setTxPage(1);
    const start = getPeriodStart(filter);
    const { start: prevStart, end: prevEnd } = getPrevPeriodRange(filter);

    Promise.all([
      supabase.from("expenses").select("*").eq("user_id", user.id)
        .gte("created_at", start.toISOString()).order("created_at", { ascending: false }),
      supabase.from("expenses").select("amount").eq("user_id", user.id)
        .gte("created_at", prevStart.toISOString()).lte("created_at", prevEnd.toISOString()),
      supabase.from("savings_goals").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: true }).limit(5),
    ]).then(([{ data: exp }, { data: prev }, { data: gl }]) => {
      setExpenses((exp ?? []) as Expense[]);
      setPrevAmt(((prev ?? []) as { amount: number }[]).reduce((s, e) => s + e.amount, 0));
      setGoals((gl ?? []) as Goal[]);
      setLoading(false);
    });
  }, [user, filter]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.current_amount, 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.target_amount, 0), [goals]);
  const goalPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const vsPercent = prevAmt > 0 ? ((totalSpent - prevAmt) / prevAmt) * 100 : null;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => ({ cat, amount }));
  }, [expenses]);

  const pieData = byCategory.map(({ cat, amount }) => ({
    name: cat, value: amount, color: CAT_COLORS[cat] ?? "#94A3B8",
  }));

  const trendData    = useMemo(() => buildTrendData(expenses, filter),        [expenses, filter]);
  const incomeVsSpend = useMemo(() => buildIncomeVsSpend(expenses, filter, income), [expenses, filter, income]);

  // Insights
  const biggestSplurge = expenses.length > 0
    ? expenses.reduce((max, e) => e.amount > max.amount ? e : max, expenses[0]!) : null;
  const mostExpensiveDay = useMemo(() => {
    const byDay: Record<string, number> = {};
    expenses.forEach(e => { const k = e.date ?? e.created_at.split("T")[0]!; byDay[k] = (byDay[k] ?? 0) + e.amount; });
    const top = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    return { date: new Date(top[0]!).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), amount: top[1]! };
  }, [expenses]);
  const favCategory = byCategory[0];

  // Transaction filtering
  const availableCategories = useMemo(() => [...new Set(expenses.map(e => e.category))], [expenses]);
  const availableMoods = useMemo(
    () => [...new Set(expenses.map(e => e.mood).filter((m): m is string => Boolean(m)))],
    [expenses],
  );
  const filteredTx = useMemo(() => {
    let list = [...expenses];
    if (txSearch) list = list.filter(e =>
      (e.note ?? "").toLowerCase().includes(txSearch.toLowerCase()) ||
      e.category.toLowerCase().includes(txSearch.toLowerCase())
    );
    if (txCategory) list = list.filter(e => e.category === txCategory);
    if (txMood) list = list.filter(e => e.mood === txMood);
    if (txSort === "amount")   list.sort((a, b) => b.amount - a.amount);
    if (txSort === "category") list.sort((a, b) => a.category.localeCompare(b.category));
    return list;
  }, [expenses, txSearch, txCategory, txMood, txSort]);

  const totalTxPages = Math.ceil(filteredTx.length / TX_PER_PAGE);
  const paginatedTx  = filteredTx.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE);

  function changeFilter(f: FilterPeriod) {
    setFilter(f); setTxPage(1); setTxCategory(null); setTxMood(null); setTxSearch("");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 pt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold font-serif text-foreground">hey {firstName} ✨</h1>
          <p className="text-muted-foreground text-sm font-medium">your financial dashboard</p>
        </div>
        <Link to="/pet"
          className="w-11 h-11 rounded-full bg-white/60 border-2 border-white flex items-center justify-center text-2xl shadow-sm hover:scale-110 transition-transform">
          {petEmoji}
        </Link>
      </div>

      {/* ── TIME FILTER BAR ─────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => changeFilter(key)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-250 cursor-pointer"
            style={filter === key ? {
              background: "linear-gradient(135deg, #FF6B9D, #B06EFF)",
              color: "white",
              boxShadow: "0 4px 14px rgba(176,110,255,0.45)",
            } : {
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.7)",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── SPENDING OVERVIEW CARD ──────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skel w="w-3/4" h="h-12" extra="mx-auto" />
            <Skel h="h-3" extra="mx-auto w-1/2" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Skel h="h-16" extra="rounded-xl" />
              <Skel h="h-16" extra="rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">total spent</p>
              <p className="text-5xl font-extrabold font-serif leading-none gradient-text">{INR(totalSpent)}</p>
              {vsPercent !== null && (
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span
                    className="text-sm font-bold"
                    style={{ color: vsPercent > 0 ? "#F87171" : "#34D399" }}
                  >
                    {vsPercent > 0 ? "↑" : "↓"} {Math.abs(Math.round(vsPercent))}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs previous period</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-3.5 text-center space-y-1"
                style={{ background: "rgba(52,211,153,0.1)", border: "1.5px solid rgba(52,211,153,0.25)" }}>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">total saved 💎</p>
                <p className="text-xl font-extrabold" style={{ color: "#34D399" }}>{INR(totalSaved)}</p>
              </div>
              <div className="rounded-2xl p-3.5 text-center space-y-1"
                style={{ background: "rgba(96,165,250,0.1)", border: "1.5px solid rgba(96,165,250,0.25)" }}>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">transactions ✨</p>
                <p className="text-xl font-extrabold" style={{ color: "#60A5FA" }}>{expenses.length}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── SPENDING TREND CHART ────────────────────────────────────────── */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-base font-extrabold font-serif gradient-text">spending trend 📈</h2>
        {loading ? (
          <div className="flex items-end gap-1 h-32">
            {[60, 80, 40, 100, 70, 50, 90].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-white/30 animate-pulse" style={{ height: `${h}%` }} />
            ))}
          </div>
        ) : trendData.every(d => d.amount === 0) ? (
          <p className="text-center py-8 text-sm text-muted-foreground">no data for this period 📭</p>
        ) : (
          <div className="overflow-x-auto no-scrollbar -mx-1">
            <div style={{ minWidth: Math.max(300, trendData.length * (filter === "monthly" ? 14 : 36)) }}>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={trendData} margin={{ left: 2, right: 2, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dash-area-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#B06EFF" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#FF6B9D" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="dash-line-stroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor="#FF6B9D" />
                      <stop offset="100%" stopColor="#B06EFF" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" axisLine={false} tickLine={false}
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }} />
                  <YAxis hide />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: "rgba(176,110,255,0.2)", strokeWidth: 1 }} />
                  <Area dataKey="amount" name="Spent" type="monotone"
                    stroke="url(#dash-line-stroke)" strokeWidth={2.5}
                    fill="url(#dash-area-fill)"
                    dot={{ fill: "#B06EFF", r: 3, strokeWidth: 0 }}
                    activeDot={{ fill: "#FF6B9D", r: 5, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── CATEGORY BREAKDOWN ──────────────────────────────────────────── */}
      {!loading && byCategory.length > 0 && (
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-base font-extrabold font-serif gradient-text">category breakdown 🎯</h2>
          <p className="text-[10px] text-muted-foreground -mt-2">tap a category to highlight it</p>

          <div className="flex justify-center">
            <div style={{ width: 200, height: 200 }}>
              <PieChart width={200} height={200}>
                <Pie data={pieData} cx={100} cy={100}
                  innerRadius={54} outerRadius={88}
                  dataKey="value" paddingAngle={3}
                  onClick={(_: any, idx: number) => setActiveCat(activeCat === idx ? null : idx)}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.color} stroke="rgba(255,255,255,0.5)" strokeWidth={2}
                      opacity={activeCat === null || activeCat === i ? 1 : 0.3} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </div>
          </div>

          <div className="space-y-1.5">
            {byCategory.map(({ cat, amount }, i) => {
              const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
              const color = CAT_COLORS[cat] ?? "#94A3B8";
              const isHighlighted = activeCat === null || activeCat === i;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(activeCat === i ? null : i)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                  style={{
                    background: activeCat === i ? `${color}18` : "transparent",
                    opacity: isHighlighted ? 1 : 0.45,
                    border: activeCat === i ? `1px solid ${color}35` : "1px solid transparent",
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${color}22` }}>
                    {CAT_EMOJI[cat] ?? "💸"}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between text-xs font-bold text-foreground">
                      <span>{cat}</span>
                      <span>{INR(amount)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-white/40 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── INCOME vs SPENDING BAR CHART ────────────────────────────────── */}
      {income > 0 && (
        <div className="glass-card p-5 space-y-3">
          <h2 className="text-base font-extrabold font-serif gradient-text">income vs spending 💜</h2>
          <div className="flex gap-4 text-[10px] font-bold text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#B06EFF" }} />Income
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#FF6B9D" }} />Spending
            </div>
          </div>
          {loading ? (
            <div className="flex items-end gap-2 h-28">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1 flex gap-0.5 items-end h-full">
                  <div className="flex-1 bg-white/30 animate-pulse rounded-t" style={{ height: "65%" }} />
                  <div className="flex-1 bg-white/20 animate-pulse rounded-t" style={{ height: "40%" }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar -mx-1">
              <div style={{ minWidth: Math.max(300, incomeVsSpend.length * 55) }}>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={incomeVsSpend} barCategoryGap="28%" barGap={2}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false}
                      tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }} />
                    <YAxis hide />
                    <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.08)", radius: 6 }} />
                    <Bar dataKey="income"   name="Income"   fill="#B06EFF" radius={[5,5,0,0]} maxBarSize={22} fillOpacity={0.85} />
                    <Bar dataKey="spending" name="Spending" fill="#FF6B9D" radius={[5,5,0,0]} maxBarSize={22} fillOpacity={0.90} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SAVINGS TRACKER ─────────────────────────────────────────────── */}
      {(loading || goals.length > 0) && (
        <div className="glass-card p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-extrabold font-serif gradient-text">savings tracker 💎</h2>
            <Link to="/goals" className="text-xs text-primary font-bold hover:underline">manage →</Link>
          </div>
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Skel w="w-40" h="h-40" extra="rounded-full" />
              <Skel w="w-44" h="h-4" />
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <SavingsRing pct={goalPct} saved={totalSaved} target={totalTarget} />
              </div>
              {goals.length > 0 && (
                <div className="space-y-2.5">
                  {goals.map(goal => {
                    const pct = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
                    const done = pct >= 100;
                    return (
                      <div key={goal.id} className="flex items-center gap-3">
                        <span className="text-xl flex-shrink-0">{goal.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
                            <span className="truncate">{goal.name}</span>
                            <span className="flex-shrink-0 ml-2" style={{ color: done ? "#34D399" : "hsl(var(--primary))" }}>
                              {Math.round(pct)}%{done ? " 🎉" : ""}
                            </span>
                          </div>
                          <div className="h-2 bg-white/40 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{
                              width: `${pct}%`,
                              background: done ? "linear-gradient(90deg,#6EE7B7,#34D399)" : "var(--gradient-primary)",
                            }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── SPENDING INSIGHTS ROW ───────────────────────────────────────── */}
      {!loading && expenses.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-base font-extrabold font-serif gradient-text">spending intel 🔍</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                icon: "💸", label: "biggest splurge",
                value: biggestSplurge ? INR(biggestSplurge.amount) : "–",
                sub: biggestSplurge?.category ?? "",
              },
              {
                icon: "📅", label: "priciest day",
                value: mostExpensiveDay?.date ?? "–",
                sub: mostExpensiveDay ? INR(mostExpensiveDay.amount) : "",
              },
              {
                icon: "🏆", label: "fave category",
                value: favCategory ? (CAT_EMOJI[favCategory.cat] ?? "💸") : "–",
                sub: favCategory?.cat ?? "No data",
              },
            ].map(stat => (
              <div key={stat.label} className="glass-card p-3.5 space-y-1.5 text-center">
                <span className="text-xl">{stat.icon}</span>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide leading-tight">{stat.label}</p>
                <p className="text-xs font-extrabold gradient-text leading-tight">{stat.value}</p>
                {stat.sub && <p className="text-[9px] text-muted-foreground truncate">{stat.sub}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TRANSACTION HISTORY ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold font-serif gradient-text">transactions 📋</h2>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">🔍</span>
          <input
            type="text"
            placeholder="search by name or category..."
            value={txSearch}
            onChange={e => { setTxSearch(e.target.value); setTxPage(1); }}
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none text-foreground placeholder:text-muted-foreground transition-colors"
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(16px)",
              border: "1.5px solid rgba(255,255,255,0.7)",
            }}
          />
        </div>

        {/* Category filter pills */}
        {availableCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => { setTxCategory(null); setTxPage(1); }}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer"
              style={!txCategory ? {
                background: "linear-gradient(135deg, #FF6B9D, #B06EFF)", color: "white",
              } : { background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.7)", color: "hsl(var(--muted-foreground))" }}
            >All</button>
            {availableCategories.map(cat => (
              <button key={cat}
                onClick={() => { setTxCategory(txCategory === cat ? null : cat); setTxPage(1); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer"
                style={txCategory === cat ? {
                  background: CAT_COLORS[cat] ?? "#B06EFF", color: "white",
                } : { background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.7)", color: "hsl(var(--muted-foreground))" }}
              >
                {CAT_EMOJI[cat] ?? "💸"} {cat}
              </button>
            ))}
          </div>
        )}

        {/* Mood filter + Sort */}
        <div className="flex gap-2 items-center">
          {availableMoods.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
              {availableMoods.map(mood => (
                <button key={mood}
                  onClick={() => { setTxMood(txMood === mood ? null : mood); setTxPage(1); }}
                  className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer"
                  style={txMood === mood ? {
                    background: "linear-gradient(135deg, #FBBF24, #F59E0B)", color: "white",
                  } : { background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.7)", color: "hsl(var(--muted-foreground))" }}
                >
                  {MOOD_EMOJI[mood] ?? "🌀"} {mood}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-1.5 flex-shrink-0 ml-auto">
            {(["date", "amount", "category"] as const).map(s => (
              <button key={s}
                onClick={() => { setTxSort(s); setTxPage(1); }}
                title={s}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer"
                style={txSort === s ? {
                  background: "rgba(176,110,255,0.15)", border: "1.5px solid rgba(176,110,255,0.4)",
                } : { background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.7)" }}
              >
                {s === "date" ? "📅" : s === "amount" ? "💰" : "🔤"}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-card p-3.5 flex items-center gap-3 animate-pulse">
                <Skel w="w-10" h="h-10" extra="rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2"><Skel w="w-28" /><Skel w="w-20" h="h-3" /></div>
                <Skel w="w-14" />
              </div>
            ))}
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="glass-card p-8 flex flex-col items-center gap-2 text-center rounded-3xl">
            <span className="text-4xl">📭</span>
            <p className="text-sm font-semibold text-foreground">
              {expenses.length === 0 ? "no transactions yet!" : "no matches found"}
            </p>
            <p className="text-xs text-muted-foreground">
              {expenses.length === 0 ? "add your first one 💸" : "try clearing some filters"}
            </p>
            {expenses.length === 0 && (
              <Link to="/add" className="gradient-btn px-5 py-2 text-sm mt-2">+ Add expense ✨</Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedTx.map(exp => {
                const diff = Date.now() - new Date(exp.created_at).getTime();
                const m = Math.floor(diff / 60000);
                const ago = m < 60 ? `${m}m ago`
                  : m < 1440 ? `${Math.floor(m / 60)}h ago`
                  : Math.floor(m / 1440) === 1 ? "yesterday"
                  : `${Math.floor(m / 1440)}d ago`;
                return (
                  <div key={exp.id} className="glass-card p-3.5 flex items-center justify-between gap-3 hover:scale-[1.01] transition-transform">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 flex-shrink-0 rounded-full bg-white/60 border border-white/70 flex items-center justify-center text-xl">
                        {exp.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-foreground text-sm truncate">{exp.category}</p>
                          {exp.mood && <span className="text-xs flex-shrink-0">{MOOD_EMOJI[exp.mood] ?? ""}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {exp.note ? `${exp.note} · ` : ""}{ago}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-sm flex-shrink-0" style={{ color: "#FF6B9D" }}>
                      -{INR(exp.amount)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalTxPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setTxPage(p => Math.max(1, p - 1))}
                  disabled={txPage === 1}
                  className="chrome-badge px-4 py-1.5 text-xs font-bold disabled:opacity-40 cursor-pointer hover:opacity-80 transition-opacity"
                >← prev</button>
                <p className="text-xs text-muted-foreground font-semibold">
                  page {txPage} of {totalTxPages} · {filteredTx.length} items
                </p>
                <button
                  onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))}
                  disabled={txPage === totalTxPages}
                  className="chrome-badge px-4 py-1.5 text-xs font-bold disabled:opacity-40 cursor-pointer hover:opacity-80 transition-opacity"
                >next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
