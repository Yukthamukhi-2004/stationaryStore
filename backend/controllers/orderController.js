const supabase = require("../config/supabase");

const getOrders = async (req, res) => {

  const { data, error } = await supabase
    .from("orders")
    .select("*");

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data);
};

const createOrder = async (req, res) => {

  const {
    user_id,
    total_amount,
    status
  } = req.body;

  console.log("Status received:", status);

  const validStatuses = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled"
];

if (!validStatuses.includes(status)) {
  return res.status(400).json({
    message: "Invalid order status"
  });
}
  const { data, error } = await supabase
    .from("orders")
    .insert([
      {
        user_id,
        total_amount,
        status
      }
    ])
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.status(201).json({
    message: "Order Created Successfully",
    order: data
  });
};

const getOrderById = async (req, res) => {

  const { id } = req.params;

  const { data, error } = await supabase
    .from("orders")
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
 * GET /orders/:id/items
 * Returns all order items for a given order, joined with product info
 */
const getOrderItems = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("order_items")
    .select(`
      id,
      order_id,
      product_id,
      quantity,
      price,
      products:product_id (
        product_name,
        image_url
      )
    `)
    .eq("order_id", id);

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data);
};

const updateOrder = async (req, res) => {

  const { id } = req.params;

  const {
    total_amount,
    status
  } = req.body;

  const validStatuses = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled"
];

if (!validStatuses.includes(status)) {
  return res.status(400).json({
    message: "Invalid order status"
  });
}

  const { data, error } = await supabase
    .from("orders")
    .update({
      total_amount,
      status
    })
    .eq("id", id)
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json({
    message: "Order Updated Successfully",
    order: data
  });
};

module.exports = {
  getOrders,
  createOrder,
  getOrderById,
  updateOrder,
  getOrderItems
};