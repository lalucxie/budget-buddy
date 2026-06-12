import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `[Budget Buddy] Missing Supabase env vars.\n` +
    `VITE_SUPABASE_URL=${supabaseUrl ?? "undefined"}\n` +
    `VITE_SUPABASE_ANON_KEY=${supabaseAnonKey ? "set" : "undefined"}`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
