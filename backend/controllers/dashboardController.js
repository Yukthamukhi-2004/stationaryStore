const supabase = require("../config/supabase");

/**
 * GET /api/dashboard/stats
 * Dashboard statistics
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

    if (
      ordersError ||
      productsError ||
      categoriesError ||
      paymentsError
    ) {
      return res.status(500).json({
        error:
          ordersError?.message ||
          productsError?.message ||
          categoriesError?.message ||
          paymentsError?.message,
      });
    }

    const completedPayments = payments.filter(
      (payment) => payment.payment_status === "completed"
    );

    const totalRevenue = completedPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const dealerInvoices = purchases.filter(
      (purchase) => purchase.type === "dealer_invoice"
    );

    const stockPurchases = purchases.filter(
      (purchase) => purchase.type === "stock_purchase"
    );

    const stockPurchaseValue = stockPurchases.reduce(
      (sum, purchase) => sum + Number(purchase.amount || 0),
      0
    );

    const statusBreakdown = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total_orders: orders.length,
      total_products: products.length,
      total_categories: categories.length,
      total_revenue: totalRevenue,
      completed_payments: completedPayments.length,
      order_status_breakdown: statusBreakdown,
      dealer_invoice_count: dealerInvoices.length,
      customer_invoice_count: orders.length,
      stock_purchase_count: stockPurchases.length,
      stock_purchase_value: stockPurchaseValue,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

/**
 * GET /api/dashboard/revenue
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

    payments.forEach((payment) => {
      if (payment.payment_status !== "completed") return;

      const date = new Date(payment.created_at);

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      monthlyRevenue[key] =
        (monthlyRevenue[key] || 0) + Number(payment.amount || 0);
    });

    const monthly = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({
        month,
        revenue,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const paymentMethodBreakdown = {};

    payments.forEach((payment) => {
      paymentMethodBreakdown[payment.payment_method] =
        (paymentMethodBreakdown[payment.payment_method] || 0) + 1;
    });

    res.json({
      total_revenue: payments
        .filter((payment) => payment.payment_status === "completed")
        .reduce(
          (sum, payment) => sum + Number(payment.amount || 0),
          0
        ),
      monthly,
      payment_method_breakdown: paymentMethodBreakdown,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

/**
 * GET /api/dashboard/orders
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

    const averageOrderValue =
      totalOrders > 0
        ? orders.reduce(
            (sum, order) => sum + Number(order.total_amount || 0),
            0
          ) / totalOrders
        : 0;

    const monthlyOrders = {};

    orders.forEach((order) => {
      const date = new Date(order.created_at);

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      monthlyOrders[key] = (monthlyOrders[key] || 0) + 1;
    });

    const monthly = Object.entries(monthlyOrders)
      .map(([month, count]) => ({
        month,
        count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const statusDistribution = {};

    orders.forEach((order) => {
      statusDistribution[order.status] =
        (statusDistribution[order.status] || 0) + 1;
    });

    res.json({
      total_orders: totalOrders,
      average_order_value: averageOrderValue,
      monthly,
      status_distribution: statusDistribution,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

/**
 * GET /api/dashboard/inventory
 */
const getInventoryAnalytics = async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("*");

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    const totalStock = products.reduce(
      (sum, product) => sum + Number(product.stock_quantity || 0),
      0
    );

    const lowStockItems = products.filter(
      (product) =>
        product.stock_quantity !== null &&
        product.stock_quantity <= 10
    );

    const outOfStockItems = products.filter(
      (product) =>
        product.stock_quantity === null ||
        product.stock_quantity === 0
    );

    const averagePrice =
      products.length > 0
        ? products.reduce(
            (sum, product) => sum + Number(product.price || 0),
            0
          ) / products.length
        : 0;

    res.json({
      total_products: products.length,
      total_stock: totalStock,
      low_stock_count: lowStockItems.length,
      out_of_stock_count: outOfStockItems.length,
      average_price: averagePrice,
      low_stock_items: lowStockItems.map((product) => ({
        id: product.id,
        product_name: product.product_name,
        stock_quantity: product.stock_quantity,
        price: product.price,
      })),
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getRevenueAnalytics,
  getOrderAnalytics,
  getInventoryAnalytics,
};
