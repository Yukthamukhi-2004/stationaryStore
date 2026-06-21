const supabase = require("../config/supabase");

const getInventorySummary = async (req, res) => {
  const { data, error } = await supabase
    .from("inventory_summary")
    .select("*");

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data);
};

module.exports = {
  getInventorySummary
};