import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase, type SavingsGoal } from "@/lib/supabase";

const GOAL_EMOJIS = ["🎧", "👟", "✈️", "💻", "🎮", "👜", "📱", "🎸", "🌴", "💄"];

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");

  // New goal form state
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎧");

  useEffect(() => {
    if (!user) return;
    fetchGoals();
  }, [user]);

  async function fetchGoals() {
    if (!user) return;
    const { data } = await supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setGoals((data ?? []) as SavingsGoal[]);
    setLoading(false);
  }

  async function handleAddGoal() {
    if (!user || !newName || !newTarget) return;
    setSaving(true);
    await supabase.from("savings_goals").insert({
      user_id: user.id,
      name: newName,
      target_amount: parseFloat(newTarget) || 0,
      current_amount: 0,
      emoji: newEmoji,
    });
    setNewName(""); setNewTarget(""); setNewEmoji("🎧");
    setShowForm(false);
    setSaving(false);
    fetchGoals();
  }

  async function handleAddSavings(goalId: string) {
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const newAmount = Math.min(goal.target_amount, goal.current_amount + amount);
    await supabase.from("savings_goals").update({ current_amount: newAmount }).eq("id", goalId);
    setAddingTo(null);
    setAddAmount("");
    fetchGoals();
  }

  async function handleDeleteGoal(goalId: string) {
    await supabase.from("savings_goals").delete().eq("id", goalId);
    fetchGoals();
  }

  return (
    <div className="p-5 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold font-serif gradient-text">Savings Goals ⭐</h1>
          <p className="text-muted-foreground text-sm">manifesting that wealth 🔮</p>
        </div>
        <button
          data-testid="button-add-goal"
          onClick={() => setShowForm(true)}
          className="gradient-btn px-4 py-2 text-sm"
        >
          + New
        </button>
      </div>

      {/* New Goal Form */}
      {showForm && (
        <div className="glass-card p-5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="font-bold text-foreground text-sm">new goal ✨</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Goal Name</label>
            <input data-testid="input-new-goal-name" type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. New AirPods" className="w-full bg-white/50 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Target Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
              <input data-testid="input-new-goal-amount" type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="0" min="0" className="w-full bg-white/50 border border-white/80 rounded-xl pl-8 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_EMOJIS.map(e => (
                <button key={e} onClick={() => setNewEmoji(e)} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all ${newEmoji === e ? "bg-white border-pink-400 scale-110 shadow-md" : "bg-white/40 border-white/60"}`}>{e}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-full border-2 border-white/60 bg-white/40 text-sm font-semibold text-muted-foreground">Cancel</button>
            <button data-testid="button-save-goal" onClick={handleAddGoal} disabled={!newName || !newTarget || saving} className="flex-[2] gradient-btn py-3 text-sm disabled:opacity-40">
              {saving ? "saving..." : "Save Goal ✨"}
            </button>
          </div>
        </div>
      )}

      {/* Goals list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => (
            <div key={i} className="glass-card p-5 animate-pulse space-y-3">
              <div className="flex justify-between"><div className="h-4 bg-white/40 rounded-full w-32" /><div className="h-4 bg-white/40 rounded-full w-12" /></div>
              <div className="h-3 bg-white/40 rounded-full" />
              <div className="flex justify-between"><div className="h-3 bg-white/30 rounded-full w-20" /><div className="h-3 bg-white/30 rounded-full w-20" /></div>
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="glass-card p-10 flex flex-col items-center text-center space-y-3">
          <span className="text-5xl">🌸</span>
          <p className="font-bold text-foreground">no goals yet!</p>
          <p className="text-sm text-muted-foreground">add your first savings goal and start manifesting ✨</p>
          <button onClick={() => setShowForm(true)} className="gradient-btn px-6 py-3 text-sm mt-2">+ Add Goal</button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const pct = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
            const done = pct >= 100;
            return (
              <div key={goal.id} data-testid={`goal-card-${goal.id}`} className="glass-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{goal.emoji}</span>
                    <div>
                      <span className="font-bold text-foreground text-sm">{goal.name}</span>
                      {done && <span className="ml-2 chrome-badge px-2 py-0.5 text-[10px]">completed 🎉</span>}
                    </div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: done ? "#34D399" : "hsl(var(--primary))" }}>{Math.round(pct)}%</span>
                </div>

                <div className="h-3 w-full bg-white/40 rounded-full overflow-hidden border border-white/40">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: done ? "linear-gradient(90deg, #6EE7B7, #34D399)" : "var(--gradient-primary)"
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>{formatINR(goal.current_amount)} saved</span>
                  <span>Goal: {formatINR(goal.target_amount)}</span>
                </div>

                {/* Add savings or delete */}
                {!done && (
                  addingTo === goal.id ? (
                    <div className="flex gap-2 animate-in fade-in duration-200">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₹</span>
                        <input
                          data-testid="input-add-savings"
                          type="number"
                          value={addAmount}
                          onChange={e => setAddAmount(e.target.value)}
                          placeholder="amount"
                          autoFocus
                          className="w-full bg-white/50 border border-white/80 rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <button onClick={() => handleAddSavings(goal.id)} className="gradient-btn px-3 py-2 text-xs">Add ✨</button>
                      <button onClick={() => { setAddingTo(null); setAddAmount(""); }} className="px-3 py-2 rounded-full border border-white/60 text-xs text-muted-foreground">✕</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button data-testid={`button-add-savings-${goal.id}`} onClick={() => setAddingTo(goal.id)} className="flex-1 py-2 rounded-full border-2 border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transition-colors">
                        + Add Savings
                      </button>
                      <button onClick={() => handleDeleteGoal(goal.id)} className="px-3 py-2 rounded-full border border-white/60 text-xs text-muted-foreground/60 hover:text-red-400 transition-colors">
                        🗑️
                      </button>
                    </div>
                  )
                )}
                {done && (
                  <div className="text-center py-1">
                    <span className="text-xs text-emerald-500 font-bold">🎉 Goal reached! You slayed this!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
