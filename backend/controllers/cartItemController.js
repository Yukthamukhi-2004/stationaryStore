const supabase = require("../config/supabase");

const getCartItems = async (req, res) => {

  const { data, error } = await supabase
    .from("cart_items")
    .select("*");

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data);
};

const createCartItem = async (req, res) => {

  const {
    cart_id,
    product_id,
    quantity
  } = req.body;

  const { data, error } = await supabase
    .from("cart_items")
    .insert([
      {
        cart_id,
        product_id,
        quantity
      }
    ])
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.status(201).json({
    message: "Cart Item Added Successfully",
    item: data
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
      error: error.message
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
    .select(`
      id,
      cart_id,
      product_id,
      quantity,
      products:product_id (
        product_name,
        price,
        image_url
      )
    `)
    .eq("cart_id", cart_id);

  if (error) {
    return res.status(500).json({
      error: error.message
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

  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({ error: "Valid quantity is required" });
  }

  if (quantity === 0) {
    // Delete the item instead of setting quantity to 0
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: "Cart item removed" });
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

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", id);

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