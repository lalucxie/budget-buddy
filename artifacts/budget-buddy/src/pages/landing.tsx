import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] relative px-6 text-center overflow-hidden">
      {/* Sparkles Background */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-[10%] left-[10%] text-3xl sparkle text-pink-300">✦</span>
        <span className="absolute top-[20%] right-[15%] text-2xl sparkle text-purple-300" style={{ animationDelay: '0.5s' }}>✧</span>
        <span className="absolute bottom-[30%] left-[15%] text-4xl sparkle text-pink-400" style={{ animationDelay: '1s' }}>⊹</span>
        <span className="absolute bottom-[20%] right-[20%] text-xl sparkle text-purple-400" style={{ animationDelay: '1.5s' }}>✦</span>
        
        {/* Floating cards */}
        <div className="absolute top-[15%] right-[-10%] glass-card p-3 transform rotate-12 blur-[1px] opacity-70 float">
          <span className="text-xs font-bold text-foreground">saved $24 💅</span>
        </div>
        <div className="absolute bottom-[25%] left-[-5%] glass-card p-3 transform -rotate-12 blur-[1px] opacity-70 float" style={{ animationDelay: '1s' }}>
          <span className="text-xs font-bold text-foreground">on track ⭐</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm mx-auto space-y-8">
        {/* Logo */}
        <div className="w-32 h-32 rounded-full bg-white/40 shadow-[0_0_40px_rgba(255,107,157,0.3)] border-2 border-white/60 flex items-center justify-center text-6xl float backdrop-blur-sm mb-4">
          💰
        </div>

        {/* Hero Text */}
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

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-2 py-2">
          <span className="chrome-badge px-3 py-1">✨ Smart Tracking</span>
          <span className="chrome-badge px-3 py-1 shimmer">💸 Budget Goals</span>
          <span className="chrome-badge px-3 py-1">🐾 Finance Pet</span>
        </div>

        {/* CTAs */}
        <div className="w-full space-y-4 pt-4">
          <Link to="/setup" className="block w-full max-w-[280px] mx-auto py-4 gradient-btn text-lg">
            Get Started ✨
          </Link>
          <Link to="/dashboard" className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            already have an account? sign in 💕
          </Link>
        </div>
      </div>
    </div>
  );
}