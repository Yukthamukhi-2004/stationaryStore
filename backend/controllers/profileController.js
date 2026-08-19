const supabase = require("../config/supabase");

/**
 * Map a DB profile row (live schema: user_id, first_name, last_name, email, role)
 * to the API shape the frontend expects (user_id + derived `name`).
 */
function mapProfile(row) {
  if (!row) return null;
  const name = [row.first_name, row.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return {
    id: row.id,
    user_id: row.user_id,
    email: row.email ?? null,
    name: name || null,
    role: row.role ?? "user",
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

function splitName(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] || null,
    last_name: parts.slice(1).join(" ") || null,
  };
}

const getProfile = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No profile found — return a 404
      return res.status(404).json({ error: "Profile not found" });
    }
    return res.status(500).json({ error: error.message });
  }

  res.json(mapProfile(data));
};

const updateProfile = async (req, res) => {
  const { user_id } = req.params;
  const updates = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  // Only fields that exist on the live profiles table can be updated.
  // `name` is mapped to first_name/last_name; age/profession/address are
  // stored client-side and intentionally ignored here.
  const sanitized = {};

  if (updates.name !== undefined) {
    const { first_name, last_name } = splitName(updates.name);
    sanitized.first_name = first_name;
    sanitized.last_name = last_name;
  }

  if (updates.role !== undefined) sanitized.role = updates.role;
  if (updates.email !== undefined) sanitized.email = updates.email;

  if (Object.keys(sanitized).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  // Always set updated_at
  sanitized.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(sanitized)
    .eq("user_id", user_id)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Profile not found" });
  }

  res.json({ message: "Profile updated successfully", profile: mapProfile(data[0]) });
};

/**
 * POST /profile
 * Creates a new profile after Supabase Auth signup.
 * Expects { user_id, name, email }
 */
const createProfile = async (req, res) => {
  try {
    const { user_id, name, email } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    // Check if profile already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user_id)
      .single();

    if (existing) {
      // Profile already exists — update the name if provided
      if (name) {
        const { first_name, last_name } = splitName(name);
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ first_name, last_name, updated_at: new Date().toISOString() })
          .eq("user_id", user_id);

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }
      }

      return res.json({ message: "Profile already exists", profile: existing });
    }

    const { first_name, last_name } = splitName(name);

    // Create new profile
    const { data, error } = await supabase
      .from("profiles")
      .insert([
        {
          user_id,
          email: email || null,
          first_name,
          last_name,
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
      message: "Profile created successfully",
      profile: mapProfile(data),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  createProfile,
};
