/**
 * Dummy Users & Orders Seeder
 *
 * Creates 50 real Supabase Auth accounts (so you can actually sign in),
 * one profile each, and a varied set of orders per user so both the
 * customer module (Orders tab, Profile) and the admin module (Orders,
 * Dashboard, Analytics) are populated with realistic data.
 *
 * Orders vary by:
 *   - order status:  Placed / Pending / Shipped / Delivered / Cancelled
 *   - payment method: upi / cod / credit_card / debit_card / net_banking
 *   - payment status: Completed / Pending / Failed
 *   - number of items (1-4) and quantities
 *   - order dates spread over the past ~5 months
 *
 * Like a real checkout, stock is deducted for non-cancelled orders, so the
 * inventory / low-stock / reorder admin views get fed as well.
 *
 * Safe to re-run:
 *   - On every run it first deletes the previously seeded dummy users and
 *     their data (detected via the "@dummy.sarada" email domain), restores
 *     the stock their orders consumed, then inserts a fresh set.
 *
 * Usage:
 *   node scripts/seed-dummy-users.js           # refresh dummy users + orders
 *   node scripts/seed-dummy-users.js --clean   # only remove dummy users + orders
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env
 *   - The `profiles`, `orders`, `order_items`, `payments`, `cart`,
 *     `cart_items` tables must exist (see supabase-schema.sql)
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "\n  ❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env\n",
  );
  console.error(
    "     Creating Auth users requires the service_role key (Supabase Dashboard → Settings → API).\n",
  );
  process.exit(1);
}

let WebSocketTransport = null;
try {
  WebSocketTransport = require("ws");
} catch (error) {
  // Fall back to the built-in runtime if ws is unavailable.
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
  realtime: WebSocketTransport ? { transport: WebSocketTransport } : undefined,
});

// ── Configuration ──
const NUM_USERS = 50;
const DUMMY_EMAIL_DOMAIN = "dummy.sarada";
const DUMMY_PASSWORD = "Dummy@123";
const ORDERS_PER_USER_MIN = 2;
const ORDERS_PER_USER_MAX = 5;
const ITEMS_PER_ORDER_MIN = 1;
const ITEMS_PER_ORDER_MAX = 4;
const MAX_QTY_PER_ITEM = 3;

// Weighted order statuses (more Delivered/Shipped for a healthy-looking store)
const STATUS_POOL = [
  { status: "Delivered", weight: 30 },
  { status: "Shipped", weight: 22 },
  { status: "Placed", weight: 15 },
  { status: "Pending", weight: 15 },
  { status: "Cancelled", weight: 18 },
];

// Weighted payment methods (lowercase — matches the frontend PAYMENT_LABELS)
const PAYMENT_METHOD_POOL = [
  { method: "upi", weight: 28 },
  { method: "cod", weight: 26 },
  { method: "credit_card", weight: 16 },
  { method: "debit_card", weight: 15 },
  { method: "net_banking", weight: 15 },
];

const FIRST_NAMES = [
  "Aarav", "Priya", "Rohan", "Sneha", "Vikram", "Ananya", "Karthik", "Divya",
  "Rahul", "Meera", "Arjun", "Pooja", "Sanjay", "Kavya", "Nikhil", "Shreya",
  "Aditya", "Lakshmi", "Varun", "Nandini", "Ravi", "Geetha", "Suresh", "Manisha",
  "Deepak", "Anjali", "Harish", "Rekha", "Mahesh", "Swathi", "Prakash", "Bhavana",
  "Sandeep", "Radhika", "Kiran", "Vasanthi", "Rajesh", "Sunitha", "Ganesh", "Padma",
  "Mohan", "Lalitha", "Srinivas", "Usha", "Venkat", "Ranjitha", "Ashok", "Saritha",
  "Naveen", "Madhavi",
];

const LAST_NAMES = [
  "Sharma", "Reddy", "Patel", "Iyer", "Nair", "Gupta", "Verma", "Rao",
  "Kulkarni", "Menon", "Pillai", "Singh", "Yadav", "Joshi", "Bose", "Das",
  "Choudhary", "Naidu", "Khatri", "Khan", "Sethi", "Mishra", "Agarwal", "Dutta",
  "Banerjee", "Mehta", "Desai", "Saxena", "Kohli", "Malhotra",
];

// ── Helpers ──
function pickWeighted(pool) {
  const total = pool.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * total;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return pool[pool.length - 1];
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function daysAgoIso(minDays, maxDays) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const offset = (minDays + Math.random() * (maxDays - minDays)) * day;
  return new Date(now - offset).toISOString();
}

function orderDateForStatus(status) {
  switch (status) {
    case "Delivered": return daysAgoIso(30, 150); // old enough to have shipped
    case "Shipped": return daysAgoIso(10, 45);
    case "Placed": return daysAgoIso(0, 5);
    case "Pending": return daysAgoIso(0, 10);
    case "Cancelled": return daysAgoIso(0, 90);
    default: return daysAgoIso(0, 30);
  }
}

function paymentStatusFor(orderStatus) {
  if (orderStatus === "Cancelled") {
    // Cancelled orders mostly had failed/abandoned payments
    return Math.random() < 0.7 ? "Failed" : "Pending";
  }
  if (orderStatus === "Delivered") return "Completed";
  if (orderStatus === "Shipped") return Math.random() < 0.8 ? "Completed" : "Pending";
  // Placed / Pending — prepaid is possible, but often still awaiting payment
  return Math.random() < 0.2 ? "Completed" : "Pending";
}

async function listAllUsers() {
  const users = [];
  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    users.push(...(data?.users || []));
    if (!data?.users || data.users.length < 200) break;
    page += 1;
  }
  return users;
}

async function deleteRows(table, column, values) {
  if (!values || values.length === 0) return;
  const { error } = await supabase.from(table).delete().in(column, values);
  if (error) {
    console.error(`  ❌ Failed to delete from ${table}: ${error.message}`);
    process.exit(1);
  }
}

// ── Cleanup: remove previous dummy users + their data, restore stock ──
async function cleanupDummyUsers() {
  const allUsers = await listAllUsers();
  const dummyUsers = allUsers.filter((u) =>
    u.email?.toLowerCase().endsWith(`@${DUMMY_EMAIL_DOMAIN}`),
  );

  if (dummyUsers.length === 0) {
    console.log("  ✅ No previously seeded dummy users found.\n");
    return;
  }

  const userIds = dummyUsers.map((u) => u.id);
  console.log(`  🧹 Found ${userIds.length} previously seeded dummy user(s).`);

  // Fetch their orders so we can restore the stock their items consumed.
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, status")
    .in("user_id", userIds);

  if (ordersError) {
    console.error(`  ❌ Could not read dummy orders: ${ordersError.message}\n`);
    process.exit(1);
  }

  const orderIds = (orders || []).map((o) => o.id);

  if (orderIds.length > 0) {
    // Restore stock consumed by non-cancelled orders.
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("order_id, product_id, quantity")
      .in("order_id", orderIds);

    if (itemsError) {
      console.error(`  ❌ Could not read dummy order items: ${itemsError.message}\n`);
      process.exit(1);
    }

    const cancelledIds = new Set(
      (orders || []).filter((o) => o.status === "Cancelled").map((o) => o.id),
    );

    const stockToRestore = new Map(); // productId -> qty
    for (const item of items || []) {
      if (cancelledIds.has(item.order_id)) continue; // never deducted
      stockToRestore.set(
        item.product_id,
        (stockToRestore.get(item.product_id) || 0) + item.quantity,
      );
    }

    if (stockToRestore.size > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, stock_quantity")
        .in("id", [...stockToRestore.keys()]);

      let restored = 0;
      for (const product of products || []) {
        const addBack = stockToRestore.get(product.id) || 0;
        if (addBack <= 0) continue;
        const newStock = Number(product.stock_quantity || 0) + addBack;
        const { error } = await supabase
          .from("products")
          .update({ stock_quantity: newStock, last_stock_update: new Date().toISOString() })
          .eq("id", product.id);
        if (!error) restored += addBack;
      }
      console.log(`  ♻️  Restored ${restored} units of stock from previous dummy orders.`);
    }

    // Remove order items → payments → orders (FK-safe order)
    await deleteRows("order_items", "order_id", orderIds);
    await deleteRows("payments", "order_id", orderIds);
    await deleteRows("orders", "id", orderIds);
  }

  // Remove carts
  const { data: carts } = await supabase.from("cart").select("id").in("user_id", userIds);
  const cartIds = (carts || []).map((c) => c.id);
  await deleteRows("cart_items", "cart_id", cartIds);
  await deleteRows("cart", "user_id", userIds);

  // Remove profiles
  await deleteRows("profiles", "user_id", userIds);

  // Remove auth users
  let removedAuth = 0;
  for (const user of dummyUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (!error) removedAuth += 1;
  }
  console.log(`  🧹 Deleted ${removedAuth} auth user(s) + ${orderIds.length} order(s).\n`);
}

// ── Seed: create users, profiles and orders ──
async function loadProductPool() {
  // Supabase caps a single request at 1000 rows — page through all of them.
  const all = [];
  let start = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id, product_name, price, stock_quantity, image_url")
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

  const dummy = [];
  const real = [];
  for (const p of all) {
    (p.image_url && p.image_url.includes("dummy-") ? dummy : real).push(p);
  }
  return { dummy, real };
}

function pickProduct(poolDummy, poolReal, remainingStock) {
  // 80% chance of a pretty dummy product, 20% a real one
  const source = Math.random() < 0.8 ? poolDummy : poolReal;
  if (source.length === 0) return null;
  const candidates = source.filter(
    (p) => (remainingStock.get(p.id) || 0) > 0,
  );
  const usable = candidates.length > 0 ? candidates : source;
  return usable[randInt(0, usable.length - 1)];
}

async function createUser(email, password, metadata) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) {
    if (/already.*regist|already.*exist|duplicate/i.test(error.message)) {
      // Already exists (e.g. interrupted previous run) — look it up and reuse.
      const users = await listAllUsers();
      const existing = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (existing) return existing;
    }
    throw new Error(`createUser(${email}) failed: ${error.message}`);
  }
  return data.user;
}

async function seed() {
  console.log("\n  ── Sarada Stationeries · Dummy Users & Orders Seeder ──\n");

  const onlyClean = process.argv.includes("--clean");

  await cleanupDummyUsers();

  if (onlyClean) {
    console.log("  ✅ Cleanup complete — no users or orders inserted.\n");
    return;
  }

  // ── 1. Load product pool ──
  const { dummy: poolDummy, real: poolReal } = await loadProductPool();
  const totalProducts = poolDummy.length + poolReal.length;
  console.log(`  🛍️  Product pool ready: ${poolDummy.length} dummy + ${poolReal.length} real products.`);

  const remainingStock = new Map();
  for (const p of [...poolDummy, ...poolReal]) {
    remainingStock.set(p.id, Number(p.stock_quantity || 0));
  }

  // ── 2. Create auth users + profiles ──
  console.log(`\n  👤 Creating ${NUM_USERS} auth users + profiles...`);

  const users = [];
  for (let i = 0; i < NUM_USERS; i += 1) {
    const num = String(i + 1).padStart(2, "0");
    const email = `user${num}@${DUMMY_EMAIL_DOMAIN}`;
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[i % LAST_NAMES.length];

    const authUser = await createUser(email, DUMMY_PASSWORD, {
      first_name: first,
      last_name: last,
    });

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        user_id: authUser.id,
        email,
        first_name: first,
        last_name: last,
        avatar_url: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
        role: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (profileError) {
      console.error(`  ❌ Profile insert failed for ${email}: ${profileError.message}`);
      process.exit(1);
    }

    users.push({ id: authUser.id, email, name: `${first} ${last}`, index: i });
  }
  console.log(`  ✅ Created ${users.length} auth users + profiles.`);

  // ── 3. Generate orders ──
  console.log("\n  📦 Generating varied orders...");

  const stats = { orders: 0, items: 0, stockDeducted: 0 };
  const statusCounts = {};
  const methodCounts = {};
  const paymentStatusCounts = {};

  const stockDeltas = new Map(); // productId -> delta (negative = deducted)

  for (const user of users) {
    const numOrders = randInt(ORDERS_PER_USER_MIN, ORDERS_PER_USER_MAX);

    for (let o = 0; o < numOrders; o += 1) {
      const statusEntry = pickWeighted(STATUS_POOL);
      const status = statusEntry.status;
      const methodEntry = pickWeighted(PAYMENT_METHOD_POOL);
      const paymentMethod = methodEntry.method;
      const paymentStatus = paymentStatusFor(status);
      const createdAt = orderDateForStatus(status);

      statusCounts[status] = (statusCounts[status] || 0) + 1;
      methodCounts[paymentMethod] = (methodCounts[paymentMethod] || 0) + 1;
      paymentStatusCounts[paymentStatus] = (paymentStatusCounts[paymentStatus] || 0) + 1;

      // Build order items
      const numItems = randInt(ITEMS_PER_ORDER_MIN, ITEMS_PER_ORDER_MAX);
      const items = [];
      const usedProductIds = new Set();

      for (let it = 0; it < numItems; it += 1) {
        const product = pickProduct(poolDummy, poolReal, remainingStock);
        if (!product) break;
        if (usedProductIds.has(product.id)) continue;
        usedProductIds.add(product.id);

        let qty = randInt(1, MAX_QTY_PER_ITEM);
        if (status !== "Cancelled") {
          // Non-cancelled orders must have stock to fulfil.
          const available = remainingStock.get(product.id) || 0;
          qty = Math.max(1, Math.min(qty, available));
          remainingStock.set(product.id, available - qty);
          stockDeltas.set(product.id, (stockDeltas.get(product.id) || 0) - qty);
          stats.stockDeducted += qty;
        }

        items.push({
          product_id: product.id,
          quantity: qty,
          price: Number(product.price),
        });
      }

      if (items.length === 0) continue;

      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{ user_id: user.id, total_amount: totalAmount, status, created_at: createdAt }])
        .select()
        .single();

      if (orderError) {
        console.error(`  ❌ Order insert failed: ${orderError.message}`);
        process.exit(1);
      }

      // Insert order items
      const { error: itemError } = await supabase.from("order_items").insert(
        items.map((item) => ({ order_id: order.id, ...item })),
      );

      if (itemError) {
        console.error(`  ❌ Order item insert failed: ${itemError.message}`);
        process.exit(1);
      }

      // Insert payment
      const { error: paymentError } = await supabase.from("payments").insert([
        {
          order_id: order.id,
          amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          payment_date: createdAt,
        },
      ]);

      if (paymentError) {
        console.error(`  ❌ Payment insert failed: ${paymentError.message}`);
        process.exit(1);
      }

      stats.orders += 1;
      stats.items += items.length;
    }
  }

  console.log(`  ✅ Created ${stats.orders} orders with ${stats.items} order items.`);

  // ── 4. Apply stock deduction ──
  console.log("\n  📉 Deducting stock for non-cancelled orders...");

  let updatedStock = 0;
  for (const [productId, delta] of stockDeltas) {
    if (delta >= 0) continue;
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", productId)
      .single();

    const newStock = Math.max(0, Number(product?.stock_quantity || 0) + delta);
    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: newStock, last_stock_update: new Date().toISOString() })
      .eq("id", productId);

    if (!error) updatedStock += 1;
  }
  console.log(`  ✅ Updated stock on ${updatedStock} products (${stats.stockDeducted} units deducted).`);

  // ── Summary ──
  console.log("\n  ─────────────────────────────────────────────");
  console.log("  📊 SEED SUMMARY");
  console.log(`      Users:            ${users.length}`);
  console.log(`      Orders:           ${stats.orders}`);
  console.log(`      Order items:      ${stats.items}`);
  console.log(`      By order status:  ${JSON.stringify(statusCounts)}`);
  console.log(`      By payment:       ${JSON.stringify(methodCounts)}`);
  console.log(`      Payment status:   ${JSON.stringify(paymentStatusCounts)}`);
  console.log("");
  console.log("  🔑 Sign in with any of:");
  console.log(`      Email:    user01@${DUMMY_EMAIL_DOMAIN} … user${String(NUM_USERS).padStart(2, "0")}@${DUMMY_EMAIL_DOMAIN}`);
  console.log(`      Password: ${DUMMY_PASSWORD}`);
  console.log("");
  console.log("  Re-run anytime to refresh, or use --clean to remove them.");
  console.log("  ─────────────────────────────────────────────\n");
}

seed().catch((err) => {
  console.error("  ❌ Unexpected error:", err.message);
  process.exit(1);
});
