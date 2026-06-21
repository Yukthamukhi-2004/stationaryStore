const express = require("express");

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
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PaperNest Backend Running");
});
app.use("/dashboard", dashboardRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/products",productRoutes);
app.use("/orders", orderRoutes);
app.use("/carts", cartRoutes);
app.use("/cart-items", cartItemRoutes);
app.use("/payments", paymentRoutes);
app.use("/checkout", checkoutRoutes);
app.use(errorHandler);
app.listen(5001, () => {
  console.log("Server running on port 5001");
});
