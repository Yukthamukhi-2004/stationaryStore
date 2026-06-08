const { createClient } = require("@supabase/supabase-js");

// Node.js 20 lacks native WebSocket, so we use the 'ws' package
const WebSocket = require("ws");
global.WebSocket = WebSocket;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. Make sure backend/.env is set up."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;