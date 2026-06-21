const supabase = require("../config/supabase");

const getDashboardStats = async (req, res) => {
  try {

    const { count: totalProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const { count: totalCategories } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });

    const { count: totalOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    const { count: totalPayments } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true });

    const { count: lowStockProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .lte("stock_quantity", 10);

    res.json({
      totalProducts,
      totalCategories,
      totalOrders,
      totalPayments,
      lowStockProducts
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats
};