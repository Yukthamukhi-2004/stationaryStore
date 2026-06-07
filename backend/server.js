const express = require("express");

const app = express();

const productRoutes = require("./routes/productRoutes");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("PaperNest Backend Running");
});

app.use("/products",productRoutes);

app.listen(5001, () => {
  console.log("Server running on port 5001");
});
