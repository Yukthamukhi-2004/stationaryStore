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

module.exports = {
  getCarts,
  createCart,
  getCartById
};