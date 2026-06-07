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

export function getAuthenticatedSupabase(_token: string) {
  throw new Error(
    "Supabase client not configured yet. Database integration pending."
  );
}