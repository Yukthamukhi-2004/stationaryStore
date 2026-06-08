export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          clerk_id: string;
          role: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          clerk_id: string;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          clerk_id?: string;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
