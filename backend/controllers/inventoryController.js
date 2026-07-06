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

const getLowStockProducts = async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .lte("stock_quantity", 10);

    if (error) {
      throw error;
    }

    res.json(data);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getReorderProducts = async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("products")
      .select("*");

    if (error) {
      throw error;
    }

    const reorderProducts = data.filter(
      product => product.stock_quantity <= product.reorder_level
    );

    res.json(reorderProducts);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getInventorySummary,
  getLowStockProducts,
  getReorderProducts
};