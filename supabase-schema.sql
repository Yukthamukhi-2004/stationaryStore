-- ============================================
-- Sarada Stationeries — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================
-- NOTE: RLS is disabled for local development.
-- The backend uses the anon key without auth context,
-- so RLS would block all write operations.
-- For production, enable RLS and use service_role key
-- in the backend Supabase client.
-- ============================================

-- 1. Profiles table (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  name TEXT,
  age INTEGER,
  profession TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products table
CREATE TABLE IF NOT EXISTS public.products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Placed' CHECK (status IN ('Placed', 'Pending', 'Shipped', 'Delivered', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Order Items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0
);

-- 6. Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'card',
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Completed', 'Failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Cart table
CREATE TABLE IF NOT EXISTS public.cart (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Cart Items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cart_id BIGINT REFERENCES public.cart(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- 9. Purchases table (tracks dealer invoices and stock purchases)
CREATE TABLE IF NOT EXISTS public.purchases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('dealer_invoice', 'stock_purchase')),
  dealer_name TEXT,
  invoice_number TEXT,
  description TEXT,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Seed data: Default categories
-- ============================================
INSERT INTO public.categories (name, description) VALUES
  ('Notebooks', 'Notebooks, diaries, and journals'),
  ('Books', 'Books, novels, and study materials'),
  ('Art Supplies', 'Art materials, paints, and brushes'),
  ('Pens', 'Pens, pencils, and writing instruments'),
  ('Office Supplies', 'Office essentials and stationery'),
  ('School Essentials', 'School supplies for students')
ON CONFLICT DO NOTHING;
