const supabase = require("../config/supabase");
const getProducts = async (req, res) => {
  const { data, error } = await supabase.from("products").select("*");
  if (error) {
    return res.status(500).json({
      error: error.message
    });
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
    image_url
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
        image_url
      }
    ])
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.status(201).json({
    message: "Product Created Successfully",
    product: data
  });
};
const updateProduct = (req, res) => {
  res.json({
    message: `Update Product ${req.params.id}`
  });
};
const deleteProduct = (req, res) => {
  res.json({
    message: `Delete Product ${req.params.id}`
  });
};
module.exports = {
  getProducts,createProduct,updateProduct,deleteProduct
};