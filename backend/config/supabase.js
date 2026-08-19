const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

let WebSocketTransport = null;

try {
  WebSocketTransport = require("ws");
} catch (error) {
  // Fall back to the built-in runtime if ws is unavailable.
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. Make sure backend/.env is set up.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
  realtime: WebSocketTransport
    ? {
        transport: WebSocketTransport,
      }
    : undefined,
});

module.exports = supabase;
