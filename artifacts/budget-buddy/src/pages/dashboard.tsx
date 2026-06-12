import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

const PET_MAP: Record<string, { emoji: string; name: string }> = {
  luna:    { emoji: "🐱", name: "Luna" },
  mochi:   { emoji: "🐼", name: "Mochi" },
  kitsune: { emoji: "🦊", name: "Kitsune" },
  ribbit:  { emoji: "🐸", name: "Ribbit" },
};

type Expense = {
  id: string;
  amount: number;
  category: string;
  emoji: string;
  note: string | null;
  created_at: string;
};

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  const income = profile?.monthly_income ?? 0;
  const pet = PET_MAP[profile?.pet_choice ?? ""] ?? { emoji: "💰", name: "Buddy" };
  const remaining = Math.max(0, income - totalSpent);
  const spentPct = income > 0 ? Math.min(100, (totalSpent / income) * 100) : 0;
  const circumference = 2 * Math.PI * 70; // r=70
  const offset = circumference - (spentPct / 100) * circumference;

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = (data ?? []) as Expense[];
        setExpenses(list);
        setTotalSpent(list.reduce((s, e) => s + e.amount, 0));
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="p-5 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">
            hey, bestie! 👋
          </h1>
          <p className="text-muted-foreground text-sm">ready to secure the bag?</p>
        </div>
        <Link to="/pet" className="w-12 h-12 rounded-full bg-white/60 border-2 border-white flex items-center justify-center text-2xl shadow-sm hover:scale-110 transition-transform" data-testid="link-pet-avatar">
          {pet.emoji}
        </Link>
      </div>

      {/* Budget Ring */}
      <div className="glass-card p-6 flex flex-col items-center mb-5">
        <div className="relative w-44 h-44 flex items-center justify-center mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF6B9D" />
                <stop offset="100%" stopColor="#B06EFF" />
              </linearGradient>
            </defs>
            <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.5)" strokeWidth="14" fill="none" />
            <circle
              cx="80" cy="80" r="70"
              stroke="url(#ring-grad)"
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={loading ? circumference : offset}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xs font-semibold text-muted-foreground">left to spend</span>
            <span className="text-2xl font-extrabold gradient-text">{formatINR(remaining)}</span>
            <span className="text-[11px] text-muted-foreground">{Math.round(100 - spentPct)}% remaining</span>
          </div>
        </div>

        <div className="flex w-full justify-around text-center">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Income</p>
            <p className="font-bold text-sm text-foreground">{formatINR(income)}</p>
          </div>
          <div className="w-px bg-white/40" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">Spent</p>
            <p className="font-bold text-sm text-primary">{formatINR(totalSpent)}</p>
          </div>
          <div className="w-px bg-white/40" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">Left</p>
            <p className="font-bold text-sm text-foreground">{formatINR(remaining)}</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Link to="/add" data-testid="link-add-expense" className="glass-card p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "var(--gradient-primary)" }}>➕</div>
          <div>
            <p className="font-bold text-sm text-foreground">Add Expense</p>
            <p className="text-xs text-muted-foreground">log it quick 💸</p>
          </div>
        </Link>
        <Link to="/goals" data-testid="link-goals" className="glass-card p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-white/50">⭐</div>
          <div>
            <p className="font-bold text-sm text-foreground">Goals</p>
            <p className="text-xs text-muted-foreground">check progress 🎯</p>
          </div>
        </Link>
      </div>

      {/* Recent Expenses */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-base font-bold font-serif text-foreground">Recent Expenses 💸</h2>
          {expenses.length > 4 && (
            <Link to="/insights" className="text-xs text-primary font-semibold">see all →</Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="glass-card p-4 flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-white/40" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/40 rounded-full w-28" />
                  <div className="h-2 bg-white/30 rounded-full w-20" />
                </div>
                <div className="h-4 bg-white/40 rounded-full w-14" />
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="glass-card p-8 flex flex-col items-center text-center space-y-2">
            <span className="text-4xl">🌸</span>
            <p className="font-semibold text-foreground text-sm">no expenses yet!</p>
            <p className="text-xs text-muted-foreground">tap ➕ to log your first one</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.slice(0, 5).map(exp => (
              <div key={exp.id} data-testid={`expense-item-${exp.id}`} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-lg border border-white/60">
                    {exp.emoji}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{exp.category}</p>
                    <p className="text-xs text-muted-foreground">{exp.note ? exp.note + " · " : ""}{timeAgo(exp.created_at)}</p>
                  </div>
                </div>
                <span className="font-bold text-foreground text-sm">-{formatINR(exp.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
