import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

type AuthMode = "hero" | "signin" | "signup";

export default function Landing() {
  const [mode, setMode]       = useState<AuthMode>("hero");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const navigate  = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (user) {
    return <Navigate to={profile?.onboarding_complete ? "/dashboard" : "/setup"} replace />;
  }

  async function handleSignUp() {
    setError("");
    setLoading(true);
    const { data, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) { setError(authErr.message); setLoading(false); return; }
    if (data.user && name.trim()) {
      await supabase
        .from("profiles")
        .upsert({ user_id: data.user.id, name: name.trim() }, { onConflict: "user_id" });
    }
    setLoading(false);
    navigate("/setup");
  }

  async function handleSignIn() {
    setError("");
    setLoading(true);
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authErr) { setError(authErr.message); return; }
    if (data.user) {
      const { data: p } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("user_id", data.user.id)
        .maybeSingle();
      navigate(p?.onboarding_complete ? "/dashboard" : "/setup", { replace: true });
    }
  }

  const inputClass = "w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/70 transition-all font-medium";

  if (mode === "signin" || mode === "signup") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] relative px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute top-[10%] left-[10%] text-3xl sparkle text-pink-300">✦</span>
          <span className="absolute top-[20%] right-[15%] text-2xl sparkle text-purple-300" style={{ animationDelay: "0.5s" }}>✧</span>
          <span className="absolute bottom-[30%] left-[15%] text-4xl sparkle text-pink-400" style={{ animationDelay: "1s" }}>⊹</span>
          <span className="absolute bottom-[20%] right-[20%] text-xl sparkle text-purple-400" style={{ animationDelay: "1.5s" }}>✦</span>
        </div>

        <div className="relative z-10 w-full max-w-sm space-y-6">
          <button
            onClick={() => { setMode("hero"); setError(""); }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mx-auto font-medium"
          >
            ← back
          </button>

          <div className="text-4xl float">💰</div>

          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold font-serif gradient-text">
              {mode === "signup" ? "join the club 💅" : "hey, you're back!"}
            </h2>
            <p className="text-sm text-muted-foreground font-accent text-base">
              {mode === "signup"
                ? "your wallet's about to get its life together"
                : "welcome back, let's check on your coins 🪙"}
            </p>
          </div>

          <div className="glass-card p-6 space-y-4 text-left">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3 font-medium">{error}</div>
            )}

            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Your name</label>
                <input
                  data-testid="input-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="what should we call you? ✨"
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Email</label>
              <input
                data-testid="input-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="bestie@email.com"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Password</label>
              <input
                data-testid="input-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                onKeyDown={e => e.key === "Enter" && (mode === "signup" ? handleSignUp() : handleSignIn())}
              />
            </div>

            <button
              data-testid={mode === "signup" ? "button-signup" : "button-signin"}
              onClick={mode === "signup" ? handleSignUp : handleSignIn}
              disabled={loading || !email || !password}
              className="w-full gradient-btn py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? "one sec bestie..."
                : mode === "signup"
                  ? "let's go ✨"
                  : "sign in 💕"}
            </button>
          </div>

          <button
            onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            {mode === "signup"
              ? "already have an account? sign in 💕"
              : "new here? create a free account ✨"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] relative px-6 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-[10%] left-[10%] text-3xl sparkle text-pink-300">✦</span>
        <span className="absolute top-[20%] right-[15%] text-2xl sparkle text-purple-300" style={{ animationDelay: "0.5s" }}>✧</span>
        <span className="absolute bottom-[30%] left-[15%] text-4xl sparkle text-pink-400" style={{ animationDelay: "1s" }}>⊹</span>
        <span className="absolute bottom-[20%] right-[20%] text-xl sparkle text-purple-400" style={{ animationDelay: "1.5s" }}>✦</span>
        <div className="absolute top-[15%] right-[-10%] glass-card p-3 transform rotate-12 blur-[1px] opacity-70 float">
          <span className="text-xs font-bold text-foreground">saved ₹240 💅</span>
        </div>
        <div className="absolute bottom-[25%] left-[-5%] glass-card p-3 transform -rotate-12 blur-[1px] opacity-70 float" style={{ animationDelay: "1s" }}>
          <span className="text-xs font-bold text-foreground">on track ⭐</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm mx-auto space-y-8">
        <div className="w-32 h-32 rounded-full bg-white/40 shadow-[0_0_40px_rgba(255,107,157,0.3)] border-2 border-white/60 flex items-center justify-center text-6xl float backdrop-blur-sm mb-4">
          💰
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl font-extrabold font-serif gradient-text tracking-tight leading-tight">
            Budget<br />Buddy
          </h1>
          <p className="text-lg font-bold text-foreground/80 leading-snug">
            your money has trust issues.
            <br />fix that.
          </p>
          <p className="text-sm font-accent text-muted-foreground text-base">
            track every spend. slay every goal. finally, a finance app that gets you.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 py-2">
          <span className="chrome-badge px-3 py-1">✨ smart tracking</span>
          <span className="chrome-badge px-3 py-1 shimmer">💸 savings goals</span>
          <span className="chrome-badge px-3 py-1">🐾 finance pet</span>
        </div>

        <div className="w-full space-y-4 pt-4">
          <button
            data-testid="button-get-started"
            onClick={() => setMode("signup")}
            className="block w-full max-w-[280px] mx-auto py-4 gradient-btn text-lg"
          >
            get started ✨
          </button>
          <button
            data-testid="button-sign-in"
            onClick={() => setMode("signin")}
            className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors mx-auto"
          >
            already have an account? sign in 💕
          </button>
        </div>
      </div>
    </div>
  );
}
