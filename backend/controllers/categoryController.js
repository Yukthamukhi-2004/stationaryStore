const supabase = require("../config/supabase");

const getCategories = async (req, res) => {
  const { data, error } = await supabase.from("categories").select("*");
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
};

const getCategoryById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: "Category not found" });
  }
  res.json(data);
};

module.exports = {
  getCategories,
  getCategoryById,
};
