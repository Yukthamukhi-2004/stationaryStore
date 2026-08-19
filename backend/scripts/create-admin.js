/**
 * Admin User Setup Script
 *
 * Creates an admin user in Supabase Auth and inserts their
 * profile with admin role.
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env
 *   - The `profiles` table must exist in the database
 *     (run supabase-schema.sql first if not)
 *
 * Usage:
 *   node scripts/create-admin.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });


const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("\n  ❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env\n");
  console.error("  Get your service_role key from Supabase Dashboard → Settings → API\n");
  process.exit(1);
}

// Use service_role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
// Generate a strong random password
const ADMIN_PASSWORD =
  "Admin@" + Math.random().toString(36).slice(2, 10) + "!";

async function createAdmin() {
  console.log(`\n  Creating admin user: ${ADMIN_EMAIL}\n`);

  // Step 1: Create user in Supabase Auth
  console.log("  1. Creating user in Supabase Auth...");
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email so user can log in immediately
    });

  if (authError) {
    if (authError.message.includes("already exists")) {
      console.log("     ✅ User already exists — skipping creation.\n");
    } else {
      console.error(`     ❌ Failed to create user: ${authError.message}\n`);
      process.exit(1);
    }
  } else {
    console.log(`     ✅ User created with ID: ${authData.user.id}\n`);
  }

  // Get the user ID (whether newly created or already existed)
  let userId;
  if (authData?.user?.id) {
    userId = authData.user.id;
  } else {
    // User already existed — fetch their ID
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(
      ADMIN_EMAIL
    );
    if (!existingUser?.user) {
      console.error("     ❌ Could not find existing user.\n");
      process.exit(1);
    }
    userId = existingUser.user.id;
  }

  // Step 2: Insert/update profile with admin role
  console.log("  2. Setting admin role in profiles table...");

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existingProfile) {
    // Update existing profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        role: "admin",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error(`     ❌ Failed to update profile: ${updateError.message}\n`);
      console.error("     Make sure the `profiles` table exists in your database.\n");
      process.exit(1);
    }
    console.log("     ✅ Profile updated with admin role.\n");
  } else {
    // Create new profile
    const { error: insertError } = await supabase
      .from("profiles")
      .insert([
        {
          user_id: userId,
          role: "admin",
          first_name: "Admin",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error(`     ❌ Failed to create profile: ${insertError.message}\n`);
      console.error("     Make sure the `profiles` table exists in your database.\n");
      console.error("     Run supabase-schema.sql first in Supabase Dashboard → SQL Editor\n");
      process.exit(1);
    }
    console.log("     ✅ Profile created with admin role.\n");
  }

  // Done!
  console.log("  ─────────────────────────────────────────────");
  console.log("  ✅ Admin user ready!");
  console.log("");
  console.log("     Email:    " + ADMIN_EMAIL);
  console.log("     Password: " + ADMIN_PASSWORD);
  console.log("");
  console.log("     Login at: http://localhost:5173/admin/login");
  console.log("  ─────────────────────────────────────────────\n");
}

createAdmin().catch((err) => {
  console.error("  ❌ Unexpected error:", err.message);
  process.exit(1);
});
