/**
 * Database Migration: Create purchase_items table
 *
 * Run this in Supabase Dashboard → SQL Editor
 * Or from CLI: node scripts/migrate-purchase-items.js
 *
 * The purchase_items table links individual products to a purchase record,
 * allowing tracking of quantity and cost per product within a stock purchase.
 */

const PURCHASE_ITEMS_SQL = `
-- 10. Purchase Items table (links products to purchases with quantity and cost)
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  purchase_id BIGINT REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups by purchase
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON public.purchase_items(purchase_id);

-- Add index for faster lookups by product
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON public.purchase_items(product_id);
`;

async function runMigration() {
  console.log("📦 Purchase Items Migration");
  console.log("============================\n");
  console.log("To run this migration:\n");
  console.log("1. Open your Supabase Dashboard");
  console.log("2. Go to SQL Editor");
  console.log("3. Paste the following SQL:\n");
  console.log(PURCHASE_ITEMS_SQL);
  console.log("\n4. Click 'Run'\n");
  console.log("Or if using the Supabase CLI:");
  console.log("  npx supabase db execute --file migration.sql\n");
}

runMigration().catch(console.error);
