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
  const allowedFields = ["role", "age", "profession", "address"];
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

module.exports = {
  getProfile,
  updateProfile,
};
