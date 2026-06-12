import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  { emoji: "🍕", label: "Food" },
  { emoji: "☕", label: "Coffee" },
  { emoji: "🛍️", label: "Shopping" },
  { emoji: "🚌", label: "Transport" },
  { emoji: "🎬", label: "Entertainment" },
  { emoji: "💊", label: "Health" },
  { emoji: "📚", label: "Education" },
  { emoji: "🏠", label: "Rent" },
  { emoji: "💡", label: "Bills" },
  { emoji: "✈️", label: "Travel" },
  { emoji: "🎮", label: "Gaming" },
  { emoji: "💅", label: "Self-care" },
];

export default function AddExpense() {
  const [amount, setAmount]       = useState("");
  const [category, setCategory]   = useState<{ emoji: string; label: string } | null>(null);
  const [customCat, setCustomCat] = useState("");
  const [note, setNote]           = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const finalCategory = customCat.trim() || category?.label || "";
  const finalEmoji    = category?.emoji ?? "💸";
  const canSave       = !!amount && parseFloat(amount) > 0 && !!finalCategory;

  async function handleSave() {
    if (!user || !canSave) return;
    setSaving(true);
    setError("");

    const { error: err } = await supabase.from("expenses").insert({
      user_id:  user.id,
      amount:   parseFloat(amount),
      category: finalCategory,
      emoji:    finalEmoji,
      note:     note.trim() || null,
    });

    setSaving(false);
    if (err) { setError(err.message); return; }
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="p-5 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold font-serif gradient-text">Add Expense 💸</h1>
        <p className="text-muted-foreground text-sm">where did the money go? ☕</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3">{error}</div>}

      {/* Big amount input */}
      <div className="glass-card p-6 flex flex-col items-center">
        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-3">Amount</label>
        <div className="flex items-center gap-1">
          <span className="text-3xl font-bold text-muted-foreground">₹</span>
          <input
            data-testid="input-amount"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            autoFocus
            className="w-44 text-5xl font-extrabold gradient-text bg-transparent border-none focus:outline-none text-center placeholder:text-muted-foreground/30"
          />
        </div>
      </div>

      {/* Category picker */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide px-1">Category</p>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              data-testid={`button-category-${cat.label}`}
              onClick={() => { setCategory(cat); setCustomCat(""); }}
              className={`glass-card p-3 flex flex-col items-center gap-1 transition-all ${
                category?.label === cat.label && !customCat
                  ? "border-2 !border-pink-400 shadow-[0_0_12px_rgba(255,107,157,0.3)] scale-105"
                  : "hover:scale-[1.03]"
              }`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-[10px] font-semibold text-muted-foreground">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Custom category */}
        <div className="flex gap-2 items-center">
          <span className="text-xl">✏️</span>
          <input
            data-testid="input-custom-category"
            type="text"
            value={customCat}
            onChange={e => { setCustomCat(e.target.value); if (e.target.value) setCategory(null); }}
            placeholder="or type a custom category..."
            className="flex-1 bg-white/50 border border-white/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide px-1">Note (optional)</p>
        <input
          data-testid="input-note"
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="treat yo self 💅"
          className="w-full bg-white/50 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all"
        />
      </div>

      {/* Save button */}
      <button
        data-testid="button-save-expense"
        onClick={handleSave}
        disabled={!canSave || saving}
        className="w-full gradient-btn py-4 text-lg disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? "saving... ✨" : "Add to Tracker ✨"}
      </button>
    </div>
  );
}
