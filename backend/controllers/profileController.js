const supabase = require("../config/supabase");

const getProfile = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_id", user_id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No profile found — return a 404
      return res.status(404).json({ error: "Profile not found" });
    }
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

const updateProfile = async (req, res) => {
  const { user_id } = req.params;
  const updates = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  // Strip out fields that should not be updatable
  const allowedFields = ["name", "role", "age", "profession", "address"];
  const sanitized = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      sanitized[key] = updates[key];
    }
  }

  if (Object.keys(sanitized).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  // Always set updated_at
  sanitized.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(sanitized)
    .eq("clerk_id", user_id)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Profile not found" });
  }

  res.json({ message: "Profile updated successfully", profile: data[0] });
};

/**
 * POST /profile
 * Creates a new profile after Supabase Auth signup.
 * Expects { clerk_id, name, email }
 */
const createProfile = async (req, res) => {
  try {
    const { clerk_id, name } = req.body;

    if (!clerk_id) {
      return res.status(400).json({ error: "clerk_id is required" });
    }

    // Check if profile already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", clerk_id)
      .single();

    if (existing) {
      // Profile already exists — update the name if provided
      if (name) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ name, updated_at: new Date().toISOString() })
          .eq("clerk_id", clerk_id);

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }
      }

      return res.json({ message: "Profile already exists", profile: existing });
    }

    // Create new profile
    const { data, error } = await supabase
      .from("profiles")
      .insert([
        {
          clerk_id,
          name: name || null,
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
      profile: data,
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
