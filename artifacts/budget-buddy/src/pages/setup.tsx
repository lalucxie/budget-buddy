import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

const GOAL_EMOJIS = ["🎧", "👟", "✈️", "💻", "🎮", "👜"];

const PETS = [
  { id: "luna",    emoji: "🐱", name: "Luna",    species: "Cat",   personality: "Luna keeps your coins safe with quiet dignity 🌙" },
  { id: "mochi",   emoji: "🐼", name: "Mochi",   species: "Panda", personality: "Mochi turns every saved rupee into a little happy dance 🎋" },
  { id: "kitsune", emoji: "🦊", name: "Kitsune", species: "Fox",   personality: "Kitsune is cunning with cash and loves a good deal ✨" },
  { id: "ribbit",  emoji: "🐸", name: "Ribbit",  species: "Frog",  personality: "Ribbit hops into action whenever you overspend 🍃" },
];

export default function Setup() {
  const [step, setStep]             = useState(1);
  const [income, setIncome]         = useState("");
  const [goalName, setGoalName]     = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalEmoji, setGoalEmoji]   = useState("🎧");
  const [pet, setPet]               = useState("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  async function handleFinish() {
    if (!user) { setError("Not logged in — please go back and sign in."); return; }
    setSaving(true);
    setError("");

    const { error: profileErr } = await supabase
      .from("profiles")
      .upsert(
        { user_id: user.id, monthly_income: parseFloat(income) || 0, pet_choice: pet, onboarding_complete: true },
        { onConflict: "user_id" }
      );

    if (profileErr) {
      setError(`Couldn't save: ${profileErr.message}`);
      setSaving(false);
      return;
    }

    if (goalName && goalAmount) {
      await supabase.from("savings_goals").insert({
        user_id: user.id,
        name: goalName,
        target_amount: parseFloat(goalAmount) || 0,
        current_amount: 0,
        emoji: goalEmoji,
      });
    }

    navigate("/dashboard", { replace: true, state: { justCompletedSetup: true } });
  }

  const progressWidth = `${(step / 3) * 100}%`;

  return (
    <div className="p-6 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground font-medium mb-2">
          <span>step {step} of 3</span>
          <span>{step === 1 ? "almost there! 💫" : step === 2 ? "slay! 🔥" : "last one! 🎉"}</span>
        </div>
        <div className="w-full h-2.5 bg-white/40 rounded-full overflow-hidden border border-white/60">
          <div className="h-full rounded-full transition-all duration-500 ease-out shimmer" style={{ width: progressWidth, background: "var(--gradient-primary)" }} />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center space-y-2">
            <div className="text-5xl mb-4 float inline-block">💸</div>
            <h1 className="text-2xl font-extrabold font-serif gradient-text leading-tight">hey bestie, let's set up<br />your money 💸</h1>
            <p className="text-sm text-muted-foreground">tell us what you work with each month</p>
          </div>
          <div className="glass-card p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Monthly Income / Allowance</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">₹</span>
                <input data-testid="input-income" type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="0" min="0" className="w-full bg-white/50 border border-white/80 rounded-xl pl-9 pr-4 py-3.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all" />
              </div>
              <p className="text-xs text-muted-foreground pl-1">stipend, pocket money, part-time gig — whatever comes in ✨</p>
            </div>
            <button data-testid="button-step1-next" onClick={() => setStep(2)} disabled={!income} className="w-full gradient-btn py-3.5 text-base disabled:opacity-40 disabled:cursor-not-allowed">Next ✨</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center space-y-2">
            <div className="text-5xl mb-4 float inline-block">🎯</div>
            <h1 className="text-2xl font-extrabold font-serif gradient-text leading-tight">what are you saving<br />for? 🎯</h1>
            <p className="text-sm text-muted-foreground">set your first savings goal — dream big bestie!</p>
          </div>
          <div className="glass-card p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Goal Name</label>
              <input data-testid="input-goal-name" type="text" value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="e.g. New AirPods 🎧" className="w-full bg-white/50 border border-white/80 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Target Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">₹</span>
                <input data-testid="input-goal-amount" type="number" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} placeholder="0" min="0" className="w-full bg-white/50 border border-white/80 rounded-xl pl-9 pr-4 py-3.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Pick an emoji ✨</label>
              <div className="flex gap-2 flex-wrap">
                {GOAL_EMOJIS.map(emoji => (
                  <button key={emoji} data-testid={`button-emoji-${emoji}`} onClick={() => setGoalEmoji(emoji)} className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all border-2 ${goalEmoji === emoji ? "bg-white shadow-[0_0_12px_rgba(255,107,157,0.4)] border-pink-400 scale-110" : "bg-white/40 border-white/60 hover:bg-white/70"}`}>{emoji}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button data-testid="button-step2-back" onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-full border-2 border-white/60 bg-white/40 text-sm font-semibold text-muted-foreground hover:bg-white/60 transition-all">← back</button>
              <button data-testid="button-step2-next" onClick={() => setStep(3)} className="flex-[2] gradient-btn py-3.5 text-base">Next 🎯</button>
            </div>
            <button data-testid="button-step2-skip" onClick={() => setStep(3)} className="w-full text-xs text-muted-foreground hover:text-primary transition-colors">skip for now →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center space-y-2">
            <div className="text-5xl mb-4 float inline-block">🐾</div>
            <h1 className="text-2xl font-extrabold font-serif gradient-text leading-tight">pick your financial<br />pet! 🐾</h1>
            <p className="text-sm text-muted-foreground">they'll keep you accountable (and cute about it)</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            {PETS.map(p => (
              <button key={p.id} data-testid={`button-pet-${p.id}`} onClick={() => setPet(p.id)} className={`glass-card p-4 text-left space-y-2 transition-all duration-200 ${pet === p.id ? "border-2 !border-pink-400 shadow-[0_0_20px_rgba(255,107,157,0.35)] scale-[1.03]" : "hover:scale-[1.02] hover:shadow-md"}`}>
                <div className="text-4xl">{p.emoji}</div>
                <div><div className="font-bold text-sm text-foreground">{p.name}</div><div className="text-xs text-muted-foreground">{p.species}</div></div>
                <p className="text-[11px] text-muted-foreground leading-snug">{p.personality}</p>
                {pet === p.id && <div className="chrome-badge px-2 py-0.5 text-[10px] inline-block">selected ✓</div>}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pb-6">
            <button data-testid="button-step3-back" onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-full border-2 border-white/60 bg-white/40 text-sm font-semibold text-muted-foreground hover:bg-white/60 transition-all">← back</button>
            <button data-testid="button-finish-setup" onClick={handleFinish} disabled={!pet || saving} className="flex-[2] gradient-btn py-3.5 text-base disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? "saving... ✨" : "Let's Go! 🚀"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
