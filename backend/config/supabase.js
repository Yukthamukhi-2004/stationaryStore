const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ukdeegsxgabnbxtctzgk.supabase.co";

const supabaseKey = "sb_publishable_MJtBcIuJSKNUMkH9z0Yg7Q_8IPk2AF0";

const supabase = createClient(
    supabaseUrl,
    supabaseKey
);

module.exports = supabase;