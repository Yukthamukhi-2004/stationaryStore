const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
const dashboardRoutes = require("./routes/dashboardRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const errorHandler = require("./middleware/errorHandler");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const cartItemRoutes = require("./routes/cartItemRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const profileRoutes = require("./routes/profileRoutes");
const lowStockRoutes = require("./routes/lowStockRoutes");
const reorderRoutes = require("./routes/reorderRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Stationery Backend Running" });
});

// Routes
app.use("/dashboard", dashboardRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/carts", cartRoutes);
app.use("/cart-items", cartItemRoutes);
app.use("/payments", paymentRoutes);
app.use("/checkout", checkoutRoutes);
app.use("/categories", categoryRoutes);
app.use("/profile", profileRoutes);
app.use("/low-stock", lowStockRoutes);
app.use("/reorder", reorderRoutes);
app.use("/upload", uploadRoutes);
app.use("/purchases", purchaseRoutes);
app.use("/admin", adminAuthRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

// Only start the server when run directly (not when imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
