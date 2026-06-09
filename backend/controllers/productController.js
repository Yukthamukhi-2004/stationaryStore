const supabase = require("../config/supabase");

const getProducts = async (req, res) => {
  const { data, error } = await supabase.from("products").select("*");
  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
  res.json(data);
};

const getProductById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  if (!data) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(data);
};

const createProduct = async (req, res) => {
  const {
    category_id,
    product_name,
    description,
    price,
    stock_quantity,
    image_url,
  } = req.body;

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        category_id,
        product_name,
        description,
        price,
        stock_quantity,
        image_url,
      },
    ])
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.status(201).json({
    message: "Product Created Successfully",
    product: data,
  });
};
const updateProduct = async (req, res) => {
  const { id } = req.params;

  const {
    category_id,
    product_name,
    description,
    price,
    stock_quantity,
    image_url,
  } = req.body;

  const { data, error } = await supabase
    .from("products")
    .update({
      category_id,
      product_name,
      description,
      price,
      stock_quantity,
      image_url,
    })
    .eq("id", id)
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json({
    message: "Product Updated Successfully",
    product: data,
  });
};
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json({
    message: "Product Deleted Successfully",
  });
};
module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
