const supabase = require("../config/supabase");

/**
 * GET /api/dashboard/stats
 * Returns aggregate stats: total revenue, order count, product count, category count,
 * dealer invoice count, customer invoice count, stock purchase count, stock purchase value
 */
const getDashboardStats = async (req, res) => {
  try {
    const results = await Promise.allSettled([
      supabase.from("orders").select("*"),
      supabase.from("products").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("payments").select("*"),
      supabase.from("purchases").select("*"),
    ]);

    const orders =
      results[0].status === "fulfilled" ? results[0].value.data || [] : [];
    const products =
      results[1].status === "fulfilled" ? results[1].value.data || [] : [];
    const categories =
      results[2].status === "fulfilled" ? results[2].value.data || [] : [];
    const payments =
      results[3].status === "fulfilled" ? results[3].value.data || [] : [];
    const purchases =
      results[4].status === "fulfilled" ? results[4].value.data || [] : [];

    const ordersError =
      results[0].status === "rejected"
        ? results[0].reason
        : results[0].value?.error;
    const productsError =
      results[1].status === "rejected"
        ? results[1].reason
        : results[1].value?.error;
    const categoriesError =
      results[2].status === "rejected"
        ? results[2].reason
        : results[2].value?.error;
    const paymentsError =
      results[3].status === "rejected"
        ? results[3].reason
        : results[3].value?.error;

    if (ordersError || productsError || categoriesError || paymentsError) {
      return res.status(500).json({
        error:
          ordersError?.message ||
          productsError?.message ||
          categoriesError?.message ||
          paymentsError?.message,
      });
    }

    const totalRevenue = payments
      .filter((p) => p.payment_status === "completed")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const completedPayments = payments.filter(
      (p) => p.payment_status === "completed",
    ).length;

    const dealerInvoices = Array.isArray(purchases)
      ? purchases.filter((p) => p.type === "dealer_invoice")
      : [];
    const stockPurchases = Array.isArray(purchases)
      ? purchases.filter((p) => p.type === "stock_purchase")
      : [];
    const stockPurchaseValue = stockPurchases.reduce(
      (sum, p) => sum + (p.amount || 0),
      0,
    );

    const statusBreakdown = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total_orders: orders.length,
      total_products: products.length,
      total_categories: categories.length,
      total_revenue: totalRevenue,
      completed_payments: completedPayments,
      order_status_breakdown: statusBreakdown,
      dealer_invoice_count: dealerInvoices.length,
      customer_invoice_count: orders.length,
      stock_purchase_count: stockPurchases.length,
      stock_purchase_value: stockPurchaseValue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/dashboard/revenue-analytics
 * Returns revenue over time (by month)
 */
const getRevenueAnalytics = async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const monthlyRevenue = {};
    for (const p of payments) {
      if (p.payment_status !== "completed") continue;
      const date = new Date(p.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + (p.amount || 0);
    }

    const monthlyData = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      total_revenue: payments
        .filter((p) => p.payment_status === "completed")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      monthly: monthlyData,
      payment_method_breakdown: payments.reduce((acc, p) => {
        acc[p.payment_method] = (acc[p.payment_method] || 0) + 1;
        return acc;
      }, {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/dashboard/order-analytics
 * Returns order analytics: trends, status distribution, avg order value
 */
const getOrderAnalytics = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const totalOrders = orders.length;
    const avgOrderValue =
      totalOrders > 0
        ? orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) /
          totalOrders
        : 0;

    const monthlyOrders = {};
    for (const o of orders) {
      const date = new Date(o.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyOrders[key] = (monthlyOrders[key] || 0) + 1;
    }

    const monthlyData = Object.entries(monthlyOrders)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const statusDistribution = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total_orders: totalOrders,
      average_order_value: avgOrderValue,
      monthly: monthlyData,
      status_distribution: statusDistribution,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/dashboard/inventory-analytics
 * Returns inventory analytics: total stock, low stock count, category stock
 */
const getInventoryAnalytics = async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const totalStock = products.reduce(
      (sum, p) => sum + (p.stock_quantity || 0),
      0,
    );

    const lowStockItems = products.filter(
      (p) => p.stock_quantity !== null && p.stock_quantity <= 10,
    );

    const outOfStock = products.filter(
      (p) => p.stock_quantity === null || p.stock_quantity === 0,
    );

    const avgPrice =
      products.length > 0
        ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length
        : 0;

    res.json({
      total_products: products.length,
      total_stock: totalStock,
      low_stock_count: lowStockItems.length,
      out_of_stock_count: outOfStock.length,
      average_price: avgPrice,
      low_stock_items: lowStockItems.map((p) => ({
        id: p.id,
        product_name: p.product_name,
        stock_quantity: p.stock_quantity,
        price: p.price,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getRevenueAnalytics,
  getOrderAnalytics,
  getInventoryAnalytics,
};
