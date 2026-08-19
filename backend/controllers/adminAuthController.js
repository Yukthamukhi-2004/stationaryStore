const supabase = require("../config/supabase");

/**
 * POST /api/admin/verify
 * Verifies that the authenticated user has admin role.
 * Expects a Supabase access token in the Authorization header.
 */
const verifyAdmin = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        authenticated: false,
        error: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify the token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        authenticated: false,
        error: authError?.message || "Invalid token",
      });
    }

    // Look up the user's profile using their Supabase user ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      // PGRST116 means no rows found — that's okay for new users
      return res.status(500).json({
        authenticated: false,
        error: profileError.message,
      });
    }

    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      return res.status(403).json({
        authenticated: true,
        authorized: false,
        error: "User does not have admin privileges",
        user: {
          id: user.id,
          email: user.email,
          role: profile?.role || "user",
        },
      });
    }

    // Admin verified!
    res.json({
      authenticated: true,
      authorized: true,
      user: {
        id: user.id,
        email: user.email,
        role: "admin",
      },
      profile: {
        name: user.email?.split("@")[0] || "Admin",
      },
    });
  } catch (err) {
    res.status(500).json({
      authenticated: false,
      error: err.message,
    });
  }
};

/**
 * POST /api/admin/set-role
 * Sets a user's role to "admin" (for initial setup).
 * This should be protected — for now, it's a simple endpoint.
 */
const setAdminRole = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    // Check if profile exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user_id)
      .single();

    if (existing) {
      // Update existing profile
      const { error } = await supabase
        .from("profiles")
        .update({ role: "admin", updated_at: new Date().toISOString() })
        .eq("user_id", user_id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }
    } else {
      // Create new profile with admin role
      const { error } = await supabase.from("profiles").insert([
        {
          user_id,
          role: "admin",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        return res.status(500).json({ error: error.message });
      }
    }

    res.json({
      message: "Admin role assigned successfully",
      user_id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  verifyAdmin,
  setAdminRole,
};
