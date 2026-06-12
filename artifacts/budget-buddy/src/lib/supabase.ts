import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Startup diagnostic — visible in browser DevTools console
console.log("[Budget Buddy] Supabase init check:");
console.log("  VITE_SUPABASE_URL     :", supabaseUrl ? `${supabaseUrl.slice(0, 30)}...` : "❌ UNDEFINED");
console.log("  VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? `${supabaseAnonKey.slice(0, 10)}... (length ${supabaseAnonKey.length})` : "❌ UNDEFINED");

if (!supabaseUrl || !supabaseAnonKey) {
  const msg =
    `[Budget Buddy] Missing Supabase env vars — auth will not work.\n` +
    `  VITE_SUPABASE_URL: ${supabaseUrl ?? "MISSING"}\n` +
    `  VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "present" : "MISSING"}`;
  console.error(msg);
}

export const SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder",
);

export type UserProfile = {
  id: string;
  user_id: string;
  name: string;
  monthly_income: number;
  pet_choice: string;
  onboarding_complete: boolean;
  created_at: string;
};

export type SavingsGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  emoji: string;
  created_at: string;
};
