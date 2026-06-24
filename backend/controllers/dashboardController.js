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

const getRevenueAnalytics = async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("payments")
      .select("amount");

    if (error) {
      throw error;
    }

    const totalRevenue = data.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    res.json({
      totalRevenue,
      totalPayments: data.length
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getOrderAnalytics = async (req, res) => {
  console.log("Order Analytics API Hit");
  try {

    const { data, error } = await supabase
      .from("orders")
      .select("status");

    if (error) {
      throw error;
    }

    const analytics = {};

    data.forEach(order => {
      analytics[order.status] =
        (analytics[order.status] || 0) + 1;
    });

    res.json(analytics);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = {
  getDashboardStats,
  getRevenueAnalytics,
  getOrderAnalytics
};