const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const app = express();

// ==================== Route Imports ====================
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const cartItemRoutes = require("./routes/cartItemRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const profileRoutes = require("./routes/profileRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const lowStockRoutes = require("./routes/lowStockRoutes");
const reorderRoutes = require("./routes/reorderRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// ==================== Error Handler ====================
const errorHandler = require("./middleware/errorHandler");

// ==================== Middleware ====================
app.use(cors());
app.use(express.json());

// ==================== Health Check ====================
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Stationery Backend Running",
  });
});

// ==================== API Routes ====================

// Products
app.use("/products", productRoutes);

// Orders
app.use("/orders", orderRoutes);

// Cart
app.use("/carts", cartRoutes);
app.use("/cart-items", cartItemRoutes);

// Payments & Checkout
app.use("/payments", paymentRoutes);
app.use("/checkout", checkoutRoutes);

// Categories
app.use("/categories", categoryRoutes);

// Profile
app.use("/profile", profileRoutes);

// Dashboard
app.use("/dashboard", dashboardRoutes);

// Inventory
app.use("/inventory", inventoryRoutes);

// Low Stock & Reorder
app.use("/low-stock", lowStockRoutes);
app.use("/reorder", reorderRoutes);

// Purchases
app.use("/purchases", purchaseRoutes);

// Admin
app.use("/admin", adminAuthRoutes);

// Upload Images
app.use("/upload", uploadRoutes);

// Error Handler (must be after all routes)
app.use(errorHandler);

// ==================== Server ====================
const PORT = process.env.PORT || 5001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;