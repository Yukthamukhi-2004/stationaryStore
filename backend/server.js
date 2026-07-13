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

// Product Module
app.use("/products", productRoutes);

// Order Module
app.use("/orders", orderRoutes);

// Cart Module
app.use("/carts", cartRoutes);
app.use("/cart-items", cartItemRoutes);

// Payment & Checkout
app.use("/payments", paymentRoutes);
app.use("/checkout", checkoutRoutes);

// Category Module
app.use("/categories", categoryRoutes);

// User Profile
app.use("/profile", profileRoutes);

// Dashboard
app.use("/dashboard", dashboardRoutes);

// Inventory
app.use("/inventory", inventoryRoutes);
app.use("/low-stock", lowStockRoutes);
app.use("/reorder", reorderRoutes);
app.use("/purchases", purchaseRoutes);

// Admin
app.use("/admin", adminAuthRoutes);

// Uploads
app.use("/upload", uploadRoutes);

// ==================== Error Handler ====================
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// ==================== Server ====================
const PORT = process.env.PORT || 5001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
