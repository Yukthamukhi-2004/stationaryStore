const supabase = require("../config/supabase");

const authenticate = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }

  const token = authHeader.slice("Bearer ".length);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    res.status(401).json({ error: "Invalid or expired session" });
    return false;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    res.status(500).json({ error: "Unable to verify account role" });
    return false;
  }

  req.auth = { user, role: profile?.role ?? "user" };
  return true;
};

const requireAuth = async (req, res, next) => {
  try {
    if (await authenticate(req, res)) next();
  } catch (error) {
    next(error);
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!(await authenticate(req, res))) return;
    if (req.auth.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireAuth, requireAdmin };
