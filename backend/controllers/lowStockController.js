const supabase = require("../config/supabase");

/**
 * GET /api/low-stock
 * Returns products with low stock (stock_quantity <= threshold, default 10)
 */
const getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold, 10) || 10;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .lte("stock_quantity", threshold)
      .order("stock_quantity", { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      threshold,
      count: data.length,
      products: data.map((p) => ({
        id: p.id,
        product_name: p.product_name,
        stock_quantity: p.stock_quantity,
        price: p.price,
        category_id: p.category_id,
        image_url: p.image_url,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/low-stock/:id/restock
 * Restocks a product by adding to its stock_quantity
 */
const restockProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ error: "Valid quantity is required for restocking" });
    }

    // Get current stock
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", id)
      .single();

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const newStock = (product.stock_quantity || 0) + quantity;

    const { data, error } = await supabase
      .from("products")
      .update({ stock_quantity: newStock })
      .eq("id", id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: `Product restocked successfully. New stock: ${newStock}`,
      product: data[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getLowStockProducts,
  restockProduct,
};
