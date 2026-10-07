const supabase = require("../config/supabase");

const getCartItems = async (req, res) => {
  const { data, error } = await supabase.from("cart_items").select("*");

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json(data);
};

const createCartItem = async (req, res) => {
  const { cart_id, product_id, quantity } = req.body;

  if (
    !Number.isSafeInteger(cart_id) ||
    cart_id < 1 ||
    !Number.isSafeInteger(product_id) ||
    product_id < 1 ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1
  ) {
    return res
      .status(400)
      .json({ error: "Valid cart, product, and quantity are required" });
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, stock_quantity")
    .eq("id", product_id)
    .single();

  if (productError) {
    return res.status(500).json({ error: productError.message });
  }
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (product.stock_quantity !== null && product.stock_quantity !== undefined) {
    const { data: existingItems, error: existingItemsError } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("cart_id", cart_id)
      .eq("product_id", product_id);

    if (existingItemsError) {
      return res.status(500).json({ error: existingItemsError.message });
    }

    const quantityInCart = (existingItems ?? []).reduce(
      (total, item) => total + item.quantity,
      0,
    );
    if (quantityInCart + quantity > product.stock_quantity) {
      return res.status(400).json({
        error: `Only ${Math.max(0, product.stock_quantity - quantityInCart)} more available`,
      });
    }
  }

  const { data, error } = await supabase
    .from("cart_items")
    .insert([
      {
        cart_id,
        product_id,
        quantity,
      },
    ])
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.status(201).json({
    message: "Cart Item Added Successfully",
    item: data,
  });
};

const getCartItemById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("cart_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json(data);
};

/**
 * GET /cart-items/cart/:cart_id
 * Returns all items for a specific cart, joined with product info
 */
const getCartItemsByCartId = async (req, res) => {
  const { cart_id } = req.params;

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      cart_id,
      product_id,
      quantity,
      products:product_id (
        product_name,
        price,
        image_url
      )
    `,
    )
    .eq("cart_id", cart_id);

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json(data);
};

/**
 * PUT /cart-items/:id
 * Updates the quantity of a cart item
 */
const updateCartItem = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    return res.status(400).json({ error: "Valid quantity is required" });
  }

  if (quantity === 0) {
    // Delete the item instead of setting quantity to 0
    const { error } = await supabase.from("cart_items").delete().eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: "Cart item removed" });
  }

  const { data: cartItem, error: cartItemError } = await supabase
    .from("cart_items")
    .select("id, cart_id, product_id, quantity")
    .eq("id", id)
    .single();

  if (cartItemError) {
    return res.status(500).json({ error: cartItemError.message });
  }
  if (!cartItem) {
    return res.status(404).json({ error: "Cart item not found" });
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, stock_quantity")
    .eq("id", cartItem.product_id)
    .single();

  if (productError) {
    return res.status(500).json({ error: productError.message });
  }
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (product.stock_quantity !== null && product.stock_quantity !== undefined) {
    const { data: existingItems, error: existingItemsError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartItem.cart_id)
      .eq("product_id", cartItem.product_id);

    if (existingItemsError) {
      return res.status(500).json({ error: existingItemsError.message });
    }

    const quantityInOtherItems = (existingItems ?? []).reduce(
      (total, item) =>
        total + (String(item.id) === String(id) ? 0 : item.quantity),
      0,
    );
    if (
      quantity > cartItem.quantity &&
      quantityInOtherItems + quantity > product.stock_quantity
    ) {
      return res.status(400).json({
        error: `Only ${Math.max(0, product.stock_quantity - quantityInOtherItems)} available`,
      });
    }
  }

  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", id)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    message: "Cart item updated successfully",
    item: data[0],
  });
};

/**
 * DELETE /cart-items/:id
 * Deletes a cart item
 */
const deleteCartItem = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("cart_items").delete().eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "Cart item deleted successfully" });
};

module.exports = {
  getCartItems,
  createCartItem,
  getCartItemById,
  getCartItemsByCartId,
  updateCartItem,
  deleteCartItem,
};
