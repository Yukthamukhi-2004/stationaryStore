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

module.exports = {
  getCartItems,
  createCartItem,
  getCartItemById
};