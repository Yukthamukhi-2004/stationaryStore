import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables"
  );
}

// Create a Supabase client that doesn't use the built-in auth
// Instead, we authenticate via Clerk JWT tokens passed as headers
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Clerk manages sessions
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Helper: get an authenticated Supabase client using a Clerk session token
export function getAuthenticatedSupabase(token: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// Helper types
export type Profile = {
  id: string;
  clerk_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: "customer" | "admin";
  created_at: string;
  updated_at: string;
};
