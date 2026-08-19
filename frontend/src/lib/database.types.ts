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
          id: number;
          user_id: string;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          role: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      categories: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          name: string;
          description?: string | null;
          created_at?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          created_at?: string | null;
        };
      };
      products: {
        Row: {
          id: number;
          category_id: number | null;
          product_name: string;
          description: string | null;
          price: number;
          stock_quantity: number;
          image_url: string | null;
          created_at: string | null;
        };
        Insert: {
          category_id?: number | null;
          product_name: string;
          description?: string | null;
          price: number;
          stock_quantity?: number;
          image_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          category_id?: number | null;
          product_name?: string;
          description?: string | null;
          price?: number;
          stock_quantity?: number;
          image_url?: string | null;
          created_at?: string | null;
        };
      };
      orders: {
        Row: {
          id: number;
          user_id: string;
          total_amount: number;
          status: string;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          total_amount?: number;
          status?: string;
          created_at?: string | null;
        };
        Update: {
          user_id?: string;
          total_amount?: number;
          status?: string;
          created_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: number;
          order_id: number;
          product_id: number | null;
          quantity: number;
          price: number;
        };
        Insert: {
          order_id: number;
          product_id?: number | null;
          quantity?: number;
          price?: number;
        };
        Update: {
          order_id?: number;
          product_id?: number | null;
          quantity?: number;
          price?: number;
        };
      };
      payments: {
        Row: {
          id: number;
          order_id: number | null;
          amount: number;
          payment_method: string;
          payment_status: string;
          created_at: string | null;
        };
        Insert: {
          order_id?: number | null;
          amount?: number;
          payment_method?: string;
          payment_status?: string;
          created_at?: string | null;
        };
        Update: {
          order_id?: number | null;
          amount?: number;
          payment_method?: string;
          payment_status?: string;
          created_at?: string | null;
        };
      };
      cart: {
        Row: {
          id: number;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          created_at?: string | null;
        };
        Update: {
          user_id?: string;
          created_at?: string | null;
        };
      };
      cart_items: {
        Row: {
          id: number;
          cart_id: number;
          product_id: number;
          quantity: number;
        };
        Insert: {
          cart_id: number;
          product_id: number;
          quantity?: number;
        };
        Update: {
          cart_id?: number;
          product_id?: number;
          quantity?: number;
        };
      };
      purchases: {
        Row: {
          id: number;
          type: string;
          dealer_name: string | null;
          invoice_number: string | null;
          description: string | null;
          amount: number;
          created_at: string | null;
        };
        Insert: {
          type: string;
          dealer_name?: string | null;
          invoice_number?: string | null;
          description?: string | null;
          amount: number;
          created_at?: string | null;
        };
        Update: {
          type?: string;
          dealer_name?: string | null;
          invoice_number?: string | null;
          description?: string | null;
          amount?: number;
          created_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
