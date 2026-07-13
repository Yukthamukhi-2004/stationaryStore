/**
 * Supabase Storage Bucket Setup
 *
 * Creates the `product-images` bucket for product image uploads.
 *
 * Usage:
 *   node scripts/setup-bucket.js
 *
 * This script needs the SUPABASE_SERVICE_ROLE_KEY to create buckets.
 * Add it to backend/.env:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * If you don't have the service_role key, create the bucket manually
 * via the Supabase Dashboard (instructions will be printed).
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });


const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = "product-images";

async function setupBucket() {
  console.log(`\n  Setting up "${BUCKET_NAME}" bucket in Supabase Storage...\n`);

  // Check if bucket already exists
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();
  if (listError) {
    console.error("  ❌ Could not list buckets:", listError.message);
    printManualInstructions();
    process.exit(1);
  }

  const existing = buckets.find((b) => b.name === BUCKET_NAME);
  if (existing) {
    console.log(`  ✅ Bucket "${BUCKET_NAME}" already exists.`);
    console.log(`     Public: ${existing.public ? "yes" : "no"}`);
    if (!existing.public) {
      console.log("  ⚠️  Bucket is not public! Update in Dashboard.");
      printManualInstructions();
    } else {
      console.log("  ✅ Bucket is public - ready for image uploads.\n");
      printRlsInstructions();
    }
    return;
  }

  // Create the bucket
  const { error: createError } = await supabase.storage.createBucket(
    BUCKET_NAME,
    { public: true },
  );

  if (createError) {
    console.error("  ❌ Could not create bucket:", createError.message);
    printManualInstructions();
    process.exit(1);
  }

  console.log(`  ✅ Bucket "${BUCKET_NAME}" created successfully!\n`);
  printRlsInstructions();
}

function printManualInstructions() {
  const projectRef =
    supabaseUrl.split("//")[1]?.split(".")[0] || "<project-ref>";
  console.error(`\n  → Create the bucket manually in the Supabase Dashboard:\n`);
  console.error(
    `     1. Go to https://supabase.com/dashboard/project/${projectRef}/storage/buckets`,
  );
  console.error(`     2. Click "Create bucket"`);
  console.error(`     3. Name: ${BUCKET_NAME}`);
  console.error(`     4. Public bucket: ON`);
  console.error("     5. Click Save\n");
}

function printRlsInstructions() {
  console.error(
    `  → Add an RLS policy so the anon key can upload images.\n`,
  );
  console.error(`     Open Supabase Dashboard → SQL Editor and run:\n`);
  console.error(
    `     CREATE POLICY "anon_upload_product_images"\n     ON storage.objects\n     FOR INSERT\n     TO anon\n     WITH CHECK (bucket_id = '${BUCKET_NAME}');\n`,
  );
  console.error(`  Done!\n`);
}

setupBucket().catch((err) => {
  console.error("  ❌ Unexpected error:", err.message);
  process.exit(1);
});
