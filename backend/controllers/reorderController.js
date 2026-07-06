const supabase = require("../config/supabase");

/**
 * GET /api/reorder/suggestions
 * Returns products that need reordering (stock below reorder level)
 */
const getReorderSuggestions = async (req, res) => {
  try {
    const reorderThreshold = parseInt(req.query.threshold, 10) || 20;

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .lte("stock_quantity", reorderThreshold)
      .order("stock_quantity", { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const suggestions = products.map((p) => {
      const currentStock = p.stock_quantity || 0;
      const suggestedQty = Math.max(reorderThreshold * 2 - currentStock, reorderThreshold);
      return {
        id: p.id,
        product_name: p.product_name,
        current_stock: currentStock,
        suggested_reorder_qty: suggestedQty,
        estimated_cost: (p.price || 0) * suggestedQty,
        price: p.price,
        category_id: p.category_id,
      };
    });

    const totalEstimatedCost = suggestions.reduce(
      (sum, s) => sum + s.estimated_cost,
      0
    );

    res.json({
      threshold: reorderThreshold,
      count: suggestions.length,
      total_estimated_cost: totalEstimatedCost,
      suggestions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/reorder/bulk-restock
 * Bulk restocks multiple products at once
 */
const bulkRestock = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Items array is required with product_id and quantity" });
    }

    const results = [];
    const errors = [];

    for (const item of items) {
      const { product_id, quantity } = item;

      if (!product_id || !quantity || quantity <= 0) {
        errors.push({ product_id, error: "Invalid product_id or quantity" });
        continue;
      }

      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", product_id)
        .single();

      if (fetchError || !product) {
        errors.push({
          product_id,
          error: fetchError ? fetchError.message : "Product not found",
        });
        continue;
      }

      const newStock = (product.stock_quantity || 0) + quantity;

      const { data, error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", product_id)
        .select();

      if (updateError) {
        errors.push({ product_id, error: updateError.message });
      } else {
        results.push({
          product_id,
          new_stock: newStock,
          message: `Restocked by ${quantity}`,
        });
      }
    }

    res.json({
      message: `Bulk restock completed. ${results.length} succeeded, ${errors.length} failed.`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getReorderSuggestions,
  bulkRestock,
};
