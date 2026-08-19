/**
 * Dummy Suppliers & Product Mapping Seeder
 *
 * Ensures the database has 35 suppliers (keeps any existing ones, e.g. the
 * brand distributors, and adds 30 clearly-dummy suppliers) and maps EVERY
 * existing product to one of those 35 suppliers, so the admin inventory
 * views can show who supplies each item.
 *
 * Safe to re-run:
 *   - Suppliers are matched by name, so re-runs never create duplicates.
 *   - Products are simply re-distributed round-robin across all suppliers.
 *   - Before touching anything, the current product→supplier mapping is
 *     snapshotted to scripts/.seed-supplier-state.json so `--clean` can
 *     restore the exact pre-seed state.
 *
 * Usage:
 *   node scripts/seed-dummy-suppliers.js           # ensure 35 suppliers + map products
 *   node scripts/seed-dummy-suppliers.js --clean   # restore snapshot + remove added suppliers
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)
 *     in backend/.env
 *   - `suppliers` table and `products.supplier_id` / `products.supplier_name`
 *     columns must exist (see supabase-schema.sql)
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const fs = require("fs");
const path = require("path");

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "\n  ❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in backend/.env\n",
  );
  process.exit(1);
}

let WebSocketTransport = null;
try {
  WebSocketTransport = require("ws");
} catch (error) {
  // Fall back to the built-in runtime if ws is unavailable.
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: WebSocketTransport ? { transport: WebSocketTransport } : undefined,
});

const TARGET_SUPPLIER_COUNT = 35;
const SNAPSHOT_PATH = path.resolve(__dirname, ".seed-supplier-state.json");

// 30 dummy suppliers to add (keeps the total at 35 alongside existing ones).
const DUMMY_SUPPLIERS = [
  { supplier_name: "Sai Traders", contact_person: "R. Sai", phone: "9848010001", email: "sales@saitraders.in", city: "Hyderabad" },
  { supplier_name: "Balaji Stationery Mart", contact_person: "K. Balaji", phone: "9848010002", email: "sales@balajistationery.in", city: "Vijayawada" },
  { supplier_name: "Ganesh Paper House", contact_person: "G. Anil", phone: "9848010003", email: "sales@ganeshpaper.in", city: "Chennai" },
  { supplier_name: "Sri Venkateswara Supplies", contact_person: "V. Prasad", phone: "9848010004", email: "sales@sriventures.in", city: "Tirupati" },
  { supplier_name: "Annapurna Book Depot", contact_person: "A. Rao", phone: "9848010005", email: "sales@annapurnabooks.in", city: "Warangal" },
  { supplier_name: "Lakshmi Paper Mills", contact_person: "L. Kumar", phone: "9848010006", email: "sales@lakshmipaper.in", city: "Karimnagar" },
  { supplier_name: "Om Stationery House", contact_person: "O. Prakash", phone: "9848010007", email: "sales@omstationery.in", city: "Nellore" },
  { supplier_name: "Saraswati Enterprises", contact_person: "S. Devi", phone: "9848010008", email: "sales@saraswati.in", city: "Guntur" },
  { supplier_name: "Murugan Trading Co.", contact_person: "M. Vel", phone: "9848010009", email: "sales@murugantrading.in", city: "Madurai" },
  { supplier_name: "Krishna Wholesale", contact_person: "K. Murthy", phone: "9848010010", email: "sales@krishnawholesale.in", city: "Kakinada" },
  { supplier_name: "Devi Distributors", contact_person: "D. Shankar", phone: "9848010011", email: "sales@devidistributors.in", city: "Rajahmundry" },
  { supplier_name: "Himalaya Paper Co.", contact_person: "H. Bhandari", phone: "9848010012", email: "sales@himalayapaper.in", city: "Delhi" },
  { supplier_name: "Megha Stationers", contact_person: "M. Joshi", phone: "9848010013", email: "sales@meghastationers.in", city: "Pune" },
  { supplier_name: "Shakti Office Mart", contact_person: "S. Tripathi", phone: "9848010014", email: "sales@shaktiofficemart.in", city: "Lucknow" },
  { supplier_name: "Jai Mata Di Supplies", contact_person: "J. Sharma", phone: "9848010015", email: "sales@jaimatadi.in", city: "Jaipur" },
  { supplier_name: "Sunrise Paper Agencies", contact_person: "S. Nair", phone: "9848010016", email: "sales@sunrisepaper.in", city: "Kochi" },
  { supplier_name: "Royal Stationery Works", contact_person: "R. Verma", phone: "9848010017", email: "sales@royalstationery.in", city: "Indore" },
  { supplier_name: "Blue Star Paper Co.", contact_person: "B. Sen", phone: "9848010018", email: "sales@bluestarpapers.in", city: "Kolkata" },
  { supplier_name: "Everest Supplies Hub", contact_person: "E. Thapa", phone: "9848010019", email: "sales@everestsupplies.in", city: "Dehradun" },
  { supplier_name: "Globe Traders", contact_person: "G. Mehta", phone: "9848010020", email: "sales@globetraders.in", city: "Ahmedabad" },
  { supplier_name: "Central Book Suppliers", contact_person: "C. Banerjee", phone: "9848010021", email: "sales@centralbooks.in", city: "Bhopal" },
  { supplier_name: "Lotus Paper Traders", contact_person: "L. Iyer", phone: "9848010022", email: "sales@lotuspapers.in", city: "Coimbatore" },
  { supplier_name: "Raja Stationery Stores", contact_person: "R. Raja", phone: "9848010023", email: "sales@rajastationery.in", city: "Salem" },
  { supplier_name: "Venus Office Supplies", contact_person: "V. Khan", phone: "9848010024", email: "sales@venusoffice.in", city: "Nagpur" },
  { supplier_name: "Omega Paper Mart", contact_person: "O. Singh", phone: "9848010025", email: "sales@omegapaper.in", city: "Patna" },
  { supplier_name: "Zenith Stationery Co.", contact_person: "Z. Abbas", phone: "9848010026", email: "sales@zenithstationery.in", city: "Surat" },
  { supplier_name: "Pioneer School Supplies", contact_person: "P. Dutta", phone: "9848010027", email: "sales@pioneerschool.in", city: "Ranchi" },
  { supplier_name: "Green Leaf Paper House", contact_person: "G. Krishnan", phone: "9848010028", email: "sales@greenleafpaper.in", city: "Trichy" },
  { supplier_name: "Bright Future Agencies", contact_person: "B. Patil", phone: "9848010029", email: "sales@brightfuture.in", city: "Aurangabad" },
  { supplier_name: "United Stationery Mart", contact_person: "U. Malhotra", phone: "9848010030", email: "sales@unitedstationery.in", city: "Chandigarh" },
];

function loadSnapshot() {
  try {
    return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
  } catch {
    return null;
  }
}

function saveSnapshot(snapshot) {
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), "utf8");
}

async function fetchAllProducts() {
  // Full rows are needed so the upsert below can update supplier fields
  // without tripping NOT NULL constraints on other columns.
  // Supabase caps a single request at 1000 rows — page through all of them.
  const all = [];
  let start = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id")
      .range(start, start + 999);

    if (error) {
      console.error(`  ❌ Could not load products: ${error.message}\n`);
      process.exit(1);
    }

    all.push(...(data || []));
    if (!data || data.length < 1000) break;
    start += 1000;
  }
  return all;
}

async function upsertProductSuppliers(rows) {
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await supabase
      .from("products")
      .upsert(chunk, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Failed to map products: ${error.message}\n`);
      process.exit(1);
    }
  }
}

// ── Clean: restore snapshot state and delete added suppliers ──
async function cleanup() {
  const snapshot = loadSnapshot();

  if (!snapshot) {
    console.log("  ℹ️  No supplier seed snapshot found — nothing to clean.\n");
    return;
  }

  // 1. Restore product mappings to the pre-seed state
  const products = await fetchAllProducts();
  const snapshotById = new Map(snapshot.products.map((p) => [p.id, p]));
  const restoreRows = [];

  for (const product of products) {
    const prev = snapshotById.get(product.id);
    restoreRows.push({
      id: product.id,
      supplier_id: prev?.supplier_id ?? null,
      supplier_name: prev?.supplier_name ?? null,
      last_stock_update: new Date().toISOString(),
    });
  }

  await upsertProductSuppliers(restoreRows);
  console.log(`  ♻️  Restored supplier mapping on ${restoreRows.length} products.`);

  // 2. Delete the suppliers this seeder added
  const addedIds = snapshot.added_supplier_ids || [];
  let removed = 0;
  if (addedIds.length > 0) {
    const { data, error } = await supabase
      .from("suppliers")
      .delete()
      .in("id", addedIds)
      .select("id");

    if (error) {
      console.error(`  ❌ Failed to delete added suppliers: ${error.message}\n`);
      process.exit(1);
    }
    removed = (data || []).length;
  }

  // 3. Remove the snapshot file
  fs.unlinkSync(SNAPSHOT_PATH);

  console.log(`  🧹 Removed ${removed} added dummy supplier(s).`);
  console.log("  ✅ Cleanup complete.\n");
}

async function seed() {
  console.log("\n  ── Sarada Stationeries · Dummy Suppliers Seeder ──\n");

  const onlyClean = process.argv.includes("--clean");
  if (onlyClean) {
    await cleanup();
    return;
  }

  // 1. Snapshot the current product→supplier state (for clean/restore)
  const productsBefore = await fetchAllProducts();
  const snapshot = {
    saved_at: new Date().toISOString(),
    products: productsBefore.map((p) => ({
      id: p.id,
      supplier_id: p.supplier_id,
      supplier_name: p.supplier_name,
    })),
    added_supplier_ids: [],
  };

  // 2. Fetch existing suppliers
  const { data: existingSuppliers, error: supErr } = await supabase
    .from("suppliers")
    .select("*")
    .order("id");

  if (supErr) {
    console.error(`  ❌ Could not load suppliers: ${supErr.message}\n`);
    process.exit(1);
  }

  const existing = existingSuppliers || [];
  const existingNames = new Set(existing.map((s) => s.supplier_name.toLowerCase()));

  console.log(`  🏢 Found ${existing.length} existing supplier(s).`);

  // 3. Add dummy suppliers until we reach 35
  const added = [];
  for (const supplier of DUMMY_SUPPLIERS) {
    if (existing.length + added.length >= TARGET_SUPPLIER_COUNT) break;
    if (existingNames.has(supplier.supplier_name.toLowerCase())) continue;

    const { data, error } = await supabase
      .from("suppliers")
      .insert([{ ...supplier, created_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Could not add supplier "${supplier.supplier_name}": ${error.message}\n`);
      process.exit(1);
    }
    added.push(data);
  }

  snapshot.added_supplier_ids = added.map((s) => s.id);

  const allSuppliers = [...existing, ...added];
  console.log(
    `  ✅ Suppliers now: ${allSuppliers.length} (${added.length} added this run).`,
  );

  if (allSuppliers.length < 2) {
    console.error("  ❌ Need at least 2 suppliers to map products.\n");
    process.exit(1);
  }

  // 4. Map every product to a supplier (round-robin)
  const products = productsBefore;
  console.log(`  🔗 Mapping ${products.length} products across ${allSuppliers.length} suppliers...`);

  const now = new Date().toISOString();
  const rows = products.map((product, index) => {
    const supplier = allSuppliers[index % allSuppliers.length];
    return {
      ...product, // keep every existing column intact
      supplier_id: supplier.id,
      supplier_name: supplier.supplier_name,
      last_stock_update: now,
    };
  });

  await upsertProductSuppliers(rows);

  // 5. Save snapshot and report
  saveSnapshot(snapshot);

  console.log("  ─────────────────────────────────────────────");
  console.log("  ✅ Done!");
  console.log(`      Suppliers:     ${allSuppliers.length}`);
  console.log(`      Products:      ${products.length}`);
  console.log(`      Product→supplier mapping complete (round-robin across all suppliers).`);
  console.log("      Re-run to refresh, or use --clean to restore the pre-seed state.");
  console.log("  ─────────────────────────────────────────────\n");
}

seed().catch((err) => {
  console.error("  ❌ Unexpected error:", err.message);
  process.exit(1);
});
