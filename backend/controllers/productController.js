const supabase = require("../config/supabase");

// ===================== GET ALL PRODUCTS =====================
const getProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    // Default limit is high so the admin & load-test views see every product.
    const limit = Number(req.query.limit) || 10000;

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .range(start, end);

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ===================== GET PRODUCT BY ID =====================
const getProductById = async (req, res) => {
  try {
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
      return res.status(404).json({
        message: "Product Not Found",
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ===================== SEARCH PRODUCTS =====================
const searchProducts = async (req, res) => {
  try {
    const { name } = req.query;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .ilike("product_name", `%${name}%`);

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ===================== GET PRODUCTS BY CATEGORY =====================
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId);

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ===================== SORT PRODUCTS =====================
const sortProducts = async (req, res) => {
  try {
    const { order } = req.query;

    const ascending = order === "asc";

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("price", { ascending });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ===================== CREATE PRODUCT =====================
const createProduct = async (req, res) => {
  try {
    const {
      category_id,
      product_name,
      description,
      price,
      stock_quantity,
      image_url,
    } = req.body;

    if (!product_name) {
      return res.status(400).json({
        message: "Product name is required",
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        message: "Price must be greater than 0",
      });
    }

    if (stock_quantity < 0) {
      return res.status(400).json({
        message: "Stock cannot be negative",
      });
    }

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
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ===================== UPDATE PRODUCT =====================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      category_id,
      product_name,
      description,
      price,
      stock_quantity,
      image_url,
    } = req.body;

    if (price <= 0) {
      return res.status(400).json({
        message: "Price must be greater than 0",
      });
    }

    if (stock_quantity < 0) {
      return res.status(400).json({
        message: "Stock cannot be negative",
      });
    }

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
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ===================== DELETE PRODUCT =====================
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json({
      message: "Product Deleted Successfully",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  searchProducts,
  getProductsByCategory,
  sortProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
