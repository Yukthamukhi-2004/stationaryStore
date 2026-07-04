/**
 * Database Migration: Create purchases table
 *
 * Usage:
 *   1. Open Supabase Dashboard → SQL Editor
 *   2. Copy and paste the SQL from supabase-schema.sql (section #9)
 *   3. Run the query
 *
 * Or use the Supabase Management API:
 *   node scripts/migrate-purchases.js --api-key <management-api-key>
 *
 * The Management API key can be found at:
 *   Supabase Dashboard → Settings → API → Project API keys → service_role key
 * (This is different from the anon key.)
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
  process.exit(1);
}

const projectRef = SUPABASE_URL.split("//")[1]?.split(".")[0] || "ukdeegsxgabnbxtctzgk";

const PURCHASES_SQL = `
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
`;

async function runMigration() {
  const managementApiKey = process.argv.find((a) => a.startsWith("--api-key="))?.split("=")[1];

  if (managementApiKey) {
    console.log("\n  Attempting to apply migration via Supabase Management API...\n");

    try {
      const response = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${managementApiKey}`,
            Accept: "application/json",
          },
          body: JSON.stringify({ query: PURCHASES_SQL }),
        },
      );

      if (response.ok) {
        console.log("  ✅ Purchases table created successfully!\n");
        process.exit(0);
      }

      const errorData = await response.json().catch(() => ({}));
      console.error("  ❌ API error:", errorData.message || errorData.error || response.statusText);
    } catch (err) {
      console.error("  ❌ Request failed:", err.message);
    }
  }

  // Fallback: Print manual instructions
  printManualInstructions();
}

function printManualInstructions() {
  console.log(`
  ─────────────────────────────────────────────────────
   Manual Migration Required
  ─────────────────────────────────────────────────────

  The purchases table needs to be created in your Supabase database.

  Step 1: Open Supabase Dashboard SQL Editor:
    → https://supabase.com/dashboard/project/${projectRef}/sql/new

  Step 2: Paste the following SQL and click "Run":
    ${PURCHASES_SQL.split("\n")
      .map((l) => `    ${l}`)
      .join("\n")}

  Step 3: Verify the table was created:
    → https://supabase.com/dashboard/project/${projectRef}/editor

  ─────────────────────────────────────────────────────

  Alternative: Run with Management API (programmatic):
    node scripts/migrate-purchases.js --api-key=<your-management-api-key>

  Get your Management API key from:
    Supabase Dashboard → Settings → API → Project API keys
  `);
}

runMigration().catch((err) => {
  console.error("  ❌ Unexpected error:", err.message);
  process.exit(1);
});
