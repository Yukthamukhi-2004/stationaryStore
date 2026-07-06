const supabase = require("../config/supabase");

const getCarts = async (req, res) => {

  const { data, error } = await supabase
    .from("cart")
    .select("*");

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data);
};

const createCart = async (req, res) => {

  const { user_id } = req.body;

  const { data, error } = await supabase
    .from("cart")
    .insert([
      {
        user_id
      }
    ])
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.status(201).json({
    message: "Cart Created Successfully",
    cart: data
  });
};

const getCartById = async (req, res) => {

  const { id } = req.params;

  const { data, error } = await supabase
    .from("cart")
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
 * GET /carts/user/:user_id
 * Returns a cart for a specific user (single result)
 */
const getCartByUserId = async (req, res) => {
  const { user_id } = req.params;

  const { data, error } = await supabase
    .from("cart")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  if (!data) {
    return res.status(404).json({ error: "Cart not found for this user" });
  }

  res.json(data);
};

module.exports = {
  getCarts,
  createCart,
  getCartById,
  getCartByUserId
};