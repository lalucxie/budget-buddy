import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  { emoji: "🍔", label: "Food" },
  { emoji: "🚌", label: "Transport" },
  { emoji: "🛍️", label: "Shopping" },
  { emoji: "📚", label: "Education" },
  { emoji: "🎉", label: "Fun" },
  { emoji: "💊", label: "Health" },
  { emoji: "✨", label: "Other" },
];

const MOODS = [
  { emoji: "😊", label: "Happy",   color: "#34D399" },
  { emoji: "😔", label: "Sad",     color: "#60A5FA" },
  { emoji: "😴", label: "Bored",   color: "#A78BFA" },
  { emoji: "😡", label: "Stressed",color: "#F87171" },
  { emoji: "🤩", label: "Excited", color: "#FBBF24" },
];

const CONFETTI_COLORS = ["#FF6B9D", "#B06EFF", "#FFD700", "#34D399", "#60A5FA", "#FBBF24", "#FF9BE2"];

type Particle = {
  id: number; x: number; y: number;
  vx: number; vy: number; color: string;
  size: number; rot: number; rotSpeed: number;
  shape: "rect" | "circle";
};

function useConfetti() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameRef = useRef<number | null>(null);

  function burst() {
    const list: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 40,
      vx: (Math.random() - 0.5) * 12,
      vy: -(Math.random() * 8 + 4),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 5,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 15,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));
    setParticles(list);

    let tick = 0;
    function animate() {
      tick++;
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx * 0.6,
            y: p.y + p.vy * 0.6 + tick * 0.12,
            vy: p.vy + 0.3,
            rot: p.rot + p.rotSpeed,
          }))
          .filter(p => p.y < 130)
      );
      if (tick < 80) frameRef.current = requestAnimationFrame(animate);
      else setParticles([]);
    }
    frameRef.current = requestAnimationFrame(animate);
  }

  useEffect(() => () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); }, []);

  return { particles, burst };
}

export default function AddExpense() {
  const [amount, setAmount]     = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote]         = useState("");
  const [date, setDate]         = useState(() => new Date().toISOString().split("T")[0]);
  const [mood, setMood]         = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");
  const amountRef               = useRef<HTMLInputElement>(null);
  const navigate                = useNavigate();
  const { user }                = useAuth();
  const { particles, burst }    = useConfetti();

  const canSave = !!amount && parseFloat(amount) > 0 && !!category;

  async function handleSave() {
    if (!user || !canSave) return;
    setSaving(true);
    setError("");

    const { error: err } = await supabase.from("expenses").insert({
      user_id:  user.id,
      amount:   parseFloat(amount),
      category,
      emoji:    CATEGORIES.find(c => c.label === category)?.emoji ?? "💸",
      note:     note.trim() || null,
      date,
      mood,
    });

    setSaving(false);
    if (err) { setError(err.message); return; }

    burst();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setAmount(""); setCategory(null); setNote("");
      setDate(new Date().toISOString().split("T")[0]);
      setMood(null);
      amountRef.current?.focus();
    }, 2200);
  }

  return (
    <div className="p-5 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 relative overflow-hidden pb-28">

      {/* Confetti canvas */}
      {particles.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50" style={{ overflow: "hidden" }}>
          {particles.map(p => (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.shape === "rect" ? p.size : p.size,
                height: p.shape === "rect" ? p.size * 0.5 : p.size,
                borderRadius: p.shape === "circle" ? "50%" : "2px",
                background: p.color,
                transform: `rotate(${p.rot}deg)`,
                opacity: Math.max(0, 1 - p.y / 100),
              }}
            />
          ))}
        </div>
      )}

      {/* Success overlay */}
      {success && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="success-pop glass-card px-10 py-8 flex flex-col items-center gap-3 text-center shadow-2xl">
            <div className="check-bounce text-6xl">✅</div>
            <p className="text-lg font-extrabold font-serif gradient-text">expense logged!</p>
            <p className="text-sm text-muted-foreground">your wallet is watching 👀</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold font-serif gradient-text">Add Expense 💸</h1>
        <p className="text-muted-foreground text-sm">where did the bag go? ☕</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-2xl px-4 py-3">{error}</div>
      )}

      {/* ── Amount ─────────────────────────────── */}
      <div className={`glass-card p-6 flex flex-col items-center transition-all duration-300 ${amount ? "amount-glow" : ""}`}>
        <p className="text-xs font-semibold text-foreground/50 uppercase tracking-widest mb-3">amount</p>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-muted-foreground/60 select-none">₹</span>
          <input
            ref={amountRef}
            data-testid="input-amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            autoFocus
            className="amount-input w-44 text-6xl font-extrabold bg-transparent border-none focus:outline-none text-center placeholder:text-foreground/15"
            style={{
              background: amount
                ? "linear-gradient(135deg, #FF6B9D, #B06EFF)"
                : undefined,
              WebkitBackgroundClip: amount ? "text" : undefined,
              WebkitTextFillColor: amount ? "transparent" : "hsl(var(--foreground))",
              backgroundClip: amount ? "text" : undefined,
            }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground/50 mt-2">tap and type ✨</p>
      </div>

      {/* ── Category ───────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-foreground/60 uppercase tracking-widest px-1">category</p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory">
          {CATEGORIES.map(cat => {
            const active = category === cat.label;
            return (
              <button
                key={cat.label}
                data-testid={`button-cat-${cat.label}`}
                onClick={() => setCategory(cat.label)}
                className={`flex-shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  active
                    ? "border-pink-400 bg-white shadow-[0_0_16px_rgba(255,107,157,0.4)] scale-105 text-foreground"
                    : "border-white/60 bg-white/40 text-muted-foreground hover:bg-white/70 hover:scale-[1.03]"
                }`}
              >
                <span className="text-lg">{cat.emoji}</span>
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Note ───────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground/60 uppercase tracking-widest px-1">note <span className="normal-case font-normal text-muted-foreground/50">(optional)</span></p>
        <input
          data-testid="input-note"
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="what was it for? 👀"
          className="w-full bg-white/50 border-2 border-white/70 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground transition-all"
        />
      </div>

      {/* ── Date ───────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground/60 uppercase tracking-widest px-1">date</p>
        <input
          data-testid="input-date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="w-full bg-white/50 border-2 border-white/70 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground transition-all"
        />
      </div>

      {/* ── Mood ───────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-foreground/60 uppercase tracking-widest px-1">
          how were you feeling? 🌈
        </p>
        <div className="flex justify-between gap-2">
          {MOODS.map(m => {
            const active = mood === m.label;
            return (
              <button
                key={m.label}
                data-testid={`button-mood-${m.label}`}
                onClick={() => setMood(m.label)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all duration-200 ${
                  active
                    ? "scale-110 bg-white border-transparent"
                    : "bg-white/40 border-white/60 hover:scale-105"
                }`}
                style={active ? {
                  boxShadow: `0 0 18px ${m.color}60, 0 4px 12px ${m.color}40`,
                  borderColor: m.color,
                } : {}}
              >
                <span className={`text-2xl transition-transform duration-200 ${active ? "scale-125" : ""}`}>{m.emoji}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Submit ─────────────────────────────── */}
      <button
        data-testid="button-save-expense"
        onClick={handleSave}
        disabled={!canSave || saving || success}
        className="w-full gradient-btn py-4 text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? "saving... ✨" : success ? "saved! 🎉" : "Add Expense ✨"}
      </button>
    </div>
  );
}
