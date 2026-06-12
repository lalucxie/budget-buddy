import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

type AuthMode = "hero" | "signin" | "signup";

export default function Landing() {
  const [mode, setMode] = useState<AuthMode>("hero");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect already-logged-in users — in an effect, never during render
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) return null;
  if (user) return null; // effect will redirect

  async function handleSignUp() {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    navigate("/setup");
  }

  async function handleSignIn() {
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("user_id", data.user.id)
        .maybeSingle();
      navigate(profile?.onboarding_complete ? "/dashboard" : "/setup", { replace: true });
    }
  }

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
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mx-auto"
          >
            ← back
          </button>

          <div className="text-4xl float">💰</div>
          <h2 className="text-3xl font-extrabold font-serif gradient-text">
            {mode === "signup" ? "join the club 💅" : "welcome back ✨"}
          </h2>
          <p className="text-sm text-muted-foreground -mt-2">
            {mode === "signup" ? "create your free account" : "sign in to your account"}
          </p>

          <div className="glass-card p-6 space-y-4 text-left">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Email</label>
              <input
                data-testid="input-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="bestie@email.com"
                className="w-full bg-white/50 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Password</label>
              <input
                data-testid="input-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/50 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all"
                onKeyDown={e => e.key === "Enter" && (mode === "signup" ? handleSignUp() : handleSignIn())}
              />
            </div>
            <button
              data-testid={mode === "signup" ? "button-signup" : "button-signin"}
              onClick={mode === "signup" ? handleSignUp : handleSignIn}
              disabled={loading || !email || !password}
              className="w-full gradient-btn py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "hold on bestie..." : mode === "signup" ? "Create Account ✨" : "Sign In 💕"}
            </button>
          </div>

          <button
            onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {mode === "signup" ? "already have an account? sign in 💕" : "new here? create an account ✨"}
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
          <span className="text-xs font-bold text-foreground">saved $24 💅</span>
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
          <p className="text-lg text-muted-foreground italic font-medium">
            your money, your vibe ✨
          </p>
          <p className="text-sm text-muted-foreground/80 font-medium">
            track expenses, slay goals, level up your wallet 💅
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 py-2">
          <span className="chrome-badge px-3 py-1">✨ Smart Tracking</span>
          <span className="chrome-badge px-3 py-1 shimmer">💸 Budget Goals</span>
          <span className="chrome-badge px-3 py-1">🐾 Finance Pet</span>
        </div>

        <div className="w-full space-y-4 pt-4">
          <button
            data-testid="button-get-started"
            onClick={() => setMode("signup")}
            className="block w-full max-w-[280px] mx-auto py-4 gradient-btn text-lg"
          >
            Get Started ✨
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
