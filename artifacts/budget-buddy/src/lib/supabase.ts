import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);

export type UserProfile = {
  id: string;
  user_id: string;
  name: string;
  email?: string;
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
