/**
 * Dummy Product Seeder
 *
 * Inserts 50 temporary dummy products for EVERY category in the
 * database (10 base items × 5 variants), each with 10 units of stock.
 *
 * Safe to re-run:
 *   - On every run it first deletes the previously seeded dummy
 *     products (detected via their "dummy-*" picsum image seed),
 *     then inserts a fresh set. Real products are never touched.
 *
 * Usage:
 *   node scripts/seed-dummy-products.js           # refresh dummy products
 *   node scripts/seed-dummy-products.js --clean   # only remove dummy products
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)
 *     in backend/.env
 *   - Categories are auto-created if none exist (default storefront set),
 *     otherwise every existing category is seeded.
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

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

const PRODUCTS_PER_CATEGORY = 50; // 10 base items × 5 variants
const STOCK_QUANTITY = 10;
const DUMMY_SEED_PREFIX = "dummy-";

// ── Default categories (created only when the table is empty) ──
const DEFAULT_CATEGORIES = [
  { name: "Notebooks", description: "Notebooks, diaries, and journals" },
  { name: "Books", description: "Books, novels, and study materials" },
  { name: "Art Supplies", description: "Art materials, paints, and brushes" },
  { name: "Pens", description: "Pens, pencils, and writing instruments" },
  { name: "Office Supplies", description: "Office essentials and stationery" },
  { name: "School Essentials", description: "School supplies for students" },
];

// ── Base items per category (10 per category → 50 products with variants) ──
const BASE_ITEMS = {
  notebooks: [
    { name: "Single Ruled Notebook", price: 45, description: "Classic single-ruled notebook for everyday writing." },
    { name: "Double Ruled Notebook", price: 50, description: "Double-ruled notebook ideal for handwriting practice." },
    { name: "Plain Pages Notebook", price: 40, description: "Smooth plain-page notebook for sketches and notes." },
    { name: "100 Pages Notebook", price: 55, description: "Sturdy 100-page notebook with quality paper." },
    { name: "200 Pages Notebook", price: 75, description: "Long-lasting 200-page notebook for heavy note-taking." },
    { name: "Spiral Notebook", price: 90, description: "Spiral-bound notebook that lies flat on any desk." },
    { name: "Long Book", price: 60, description: "Extra-length notebook for long-form writing." },
    { name: "Short Book", price: 35, description: "Compact notebook that fits in any school bag." },
    { name: "A4 Sheet Pack", price: 20, description: "Pack of A4 sheets for printing and assignments." },
    { name: "Color Chart", price: 30, description: "Bright color chart for school projects." },
  ],
  books: [
    { name: "Story Novel", price: 250, description: "Engaging story novel for leisure reading." },
    { name: "Fiction Book", price: 220, description: "Popular fiction titles across genres." },
    { name: "Science Textbook", price: 350, description: "Detailed science textbook for students." },
    { name: "Math Practice Book", price: 180, description: "Practice book with plenty of math problems." },
    { name: "English Grammar Book", price: 160, description: "Grammar guide with exercises and examples." },
    { name: "Poetry Collection", price: 180, description: "Beautiful collection of classic and modern poems." },
    { name: "Diary", price: 120, description: "Personal diary with lock for private thoughts." },
    { name: "Journal", price: 150, description: "Blank journal for notes, ideas, and memories." },
    { name: "Coloring Book", price: 80, description: "Relaxing coloring book with intricate designs." },
    { name: "Puzzle Book", price: 100, description: "Brain-teasing puzzles and riddles for all ages." },
  ],
  "art supplies": [
    { name: "Crayons 12 Shades", price: 45, description: "Vibrant 12-shade crayon pack for young artists." },
    { name: "Sketch Pens", price: 60, description: "Smooth sketch pens with fine tips." },
    { name: "Color Pencils", price: 55, description: "Assorted color pencils for drawing and shading." },
    { name: "Watercolor Paint Set", price: 120, description: "Beginner watercolor set with brush." },
    { name: "Acrylic Paint Set", price: 200, description: "Rich acrylic paint set for canvas art." },
    { name: "Paint Brush Set", price: 90, description: "Set of paint brushes in multiple sizes." },
    { name: "Drawing Book", price: 70, description: "Thick-paper drawing book for sketches." },
    { name: "Glitter Pack", price: 35, description: "Shimmery glitter pack for craft projects." },
    { name: "Modeling Clay", price: 65, description: "Soft, non-toxic modeling clay in bright colors." },
    { name: "Oil Pastels", price: 75, description: "Smooth oil pastels that blend easily." },
  ],
  pens: [
    { name: "Ball Pen", price: 15, description: "Everyday ball pen with smooth ink flow." },
    { name: "Gel Pen", price: 25, description: "Quick-dry gel pen with a comfortable grip." },
    { name: "Fountain Pen", price: 150, description: "Elegant fountain pen for a classic writing feel." },
    { name: "Marker Pen", price: 30, description: "Bold marker pen for highlighting and notes." },
    { name: "Highlighter Set", price: 60, description: "Neon highlighters that don't bleed through paper." },
    { name: "Permanent Marker", price: 40, description: "Waterproof permanent marker for labels." },
    { name: "HB Pencil", price: 10, description: "Reliable HB pencil with soft graphite." },
    { name: "Mechanical Pencil", price: 50, description: "Refillable mechanical pencil with lead pack." },
    { name: "Whiteboard Marker", price: 45, description: "Low-odor whiteboard marker, easily erasable." },
    { name: "Calligraphy Pen", price: 120, description: "Calligraphy pen set for artistic lettering." },
  ],
  "office supplies": [
    { name: "Stapler", price: 120, description: "Heavy-duty stapler for the office desk." },
    { name: "Staples Pack", price: 25, description: "Box of standard-size staples." },
    { name: "Paper Clips", price: 15, description: "Assorted paper clips to organize documents." },
    { name: "Binder Clips", price: 20, description: "Sturdy binder clips in assorted sizes." },
    { name: "File Folder", price: 35, description: "Durable file folders for document storage." },
    { name: "Desk Organizer", price: 250, description: "Multi-compartment organizer for a tidy desk." },
    { name: "Office Scissors", price: 60, description: "Sharp stainless-steel scissors." },
    { name: "Glue Stick", price: 25, description: "Washable glue stick for paper crafts." },
    { name: "Transparent Tape", price: 30, description: "Clear tape for sealing and mending." },
    { name: "Office Calculator", price: 350, description: "Basic 12-digit calculator with big buttons." },
  ],
  "school essentials": [
    { name: "School Bag", price: 450, description: "Spacious backpack with padded straps." },
    { name: "Lunch Box", price: 200, description: "Durable lunch box with compartments." },
    { name: "Water Bottle", price: 150, description: "Leak-proof water bottle for school." },
    { name: "Geometry Box", price: 85, description: "Complete geometry set with compass and ruler." },
    { name: "Eraser", price: 8, description: "Soft eraser that cleans without smudging." },
    { name: "Sharpener", price: 12, description: "Dual-hole sharpener with cover." },
    { name: "Scale Ruler", price: 18, description: "15 cm transparent plastic ruler." },
    { name: "Pencil Case", price: 90, description: "Zippered pencil case with plenty of room." },
    { name: "Name Labels", price: 40, description: "Self-adhesive name labels for belongings." },
    { name: "Homework Diary", price: 55, description: "Homework diary to track daily assignments." },
  ],
};

// 5 variants × 10 base items = 50 unique products per category
const VARIANTS = [
  { suffix: "", delta: 0 },
  { suffix: "Premium", delta: 30 },
  { suffix: "Mini", delta: -10 },
  { suffix: "Jumbo", delta: 20 },
  { suffix: "Deluxe", delta: 40 },
];

function normalizeCategory(name) {
  return (name || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function fallbackItems(category) {
  return Array.from({ length: 10 }, (_, i) => ({
    name: `${category.name} Essential ${i + 1}`,
    price: 50 + i * 10,
    description: `Popular ${category.name.toLowerCase()} item (dummy data).`,
  }));
}

function buildProducts(category) {
  const items =
    BASE_ITEMS[normalizeCategory(category.name)] || fallbackItems(category);

  const products = [];
  let index = 0;

  for (const item of items) {
    for (const variant of VARIANTS) {
      index += 1;
      const name = variant.suffix
        ? `${item.name} ${variant.suffix}`
        : item.name;

      products.push({
        category_id: category.id,
        product_name: name,
        description: `${item.description} (dummy data for ${category.name})`,
        price: Math.max(5, Math.round(item.price + variant.delta)),
        stock_quantity: STOCK_QUANTITY,
        image_url: `https://picsum.photos/seed/${slugify(
          `${DUMMY_SEED_PREFIX}${category.name}-${name}-${index}`,
        )}/200/200`,
      });
    }
  }

  return products;
}

async function ensureCategories() {
  const { data, error } = await supabase.from("categories").select("id").limit(1);

  if (error) {
    console.error(`  ❌ Could not check categories: ${error.message}\n`);
    process.exit(1);
  }

  if (data && data.length > 0) return;

  console.log("  📂 No categories found — creating default categories...");
  const { error: insertError } = await supabase
    .from("categories")
    .insert(DEFAULT_CATEGORIES);

  if (insertError) {
    console.error(`  ❌ Could not create default categories: ${insertError.message}\n`);
    process.exit(1);
  }
}

async function removePreviousDummyProducts() {
  // Count exact matches (head:true returns the count without row limits)
  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .ilike("image_url", `%${DUMMY_SEED_PREFIX}%`);

  if (countError) {
    console.error(`  ❌ Could not find previous dummy products: ${countError.message}\n`);
    process.exit(1);
  }

  if (!count || count === 0) {
    console.log("  ✅ No previously seeded dummy products found.\n");
    return;
  }

  // Delete by filter server-side (not affected by the 1000-row select cap)
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .ilike("image_url", `%${DUMMY_SEED_PREFIX}%`);

  if (deleteError) {
    console.error(`  ❌ Failed to remove previous dummy products: ${deleteError.message}\n`);
    process.exit(1);
  }

  console.log(`  🧹 Removed ${count} previously seeded dummy product(s).\n`);
}

async function seed() {
  console.log("\n  ── Sarada Stationeries · Dummy Product Seeder ──\n");

  const onlyClean = process.argv.includes("--clean");

  await removePreviousDummyProducts();

  if (onlyClean) {
    console.log("  ✅ Cleanup complete — no products inserted.\n");
    return;
  }

  await ensureCategories();

  // Fetch categories
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .order("id");

  if (catError) {
    console.error(`  ❌ Could not fetch categories: ${catError.message}\n`);
    process.exit(1);
  }

  if (!categories || categories.length === 0) {
    console.error("  ❌ No categories found in the database.\n");
    process.exit(1);
  }

  console.log(`  📂 Found ${categories.length} category(ies): ${categories.map((c) => c.name).join(", ")}\n`);

  // Insert products per category
  let totalInserted = 0;

  for (const category of categories) {
    const products = buildProducts(category);

    if (products.length !== PRODUCTS_PER_CATEGORY) {
      console.warn(
        `  ⚠️  "${category.name}" produced ${products.length} products (expected ${PRODUCTS_PER_CATEGORY}).`,
      );
    }

    const { error: insertError } = await supabase
      .from("products")
      .insert(products);

    if (insertError) {
      console.error(`  ❌ Failed to seed "${category.name}": ${insertError.message}\n`);
      continue;
    }

    totalInserted += products.length;
    console.log(
      `  ✅ ${category.name}: ${products.length} products · stock ${STOCK_QUANTITY} each`,
    );
  }

  console.log("\n  ─────────────────────────────────────────────");
  console.log(`  ✅ Done! Inserted ${totalInserted} dummy products across ${categories.length} categories.`);
  console.log(`      Every product has stock_quantity = ${STOCK_QUANTITY}.`);
  console.log("      Re-run anytime to refresh the set, or use --clean to remove them.");
  console.log("  ─────────────────────────────────────────────\n");
}

seed().catch((err) => {
  console.error("  ❌ Unexpected error:", err.message);
  process.exit(1);
});
