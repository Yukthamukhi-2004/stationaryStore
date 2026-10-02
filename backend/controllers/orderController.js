const supabase = require("../config/supabase");

const getOrders = async (req, res) => {
  let query = supabase.from("orders").select("*");
  if (req.auth.role !== "admin") {
    query = query.eq("user_id", req.auth.user.id);
  }
  const { data, error } = await query;

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json(data);
};

const createOrder = async (req, res) => {
  const { user_id, total_amount, status } = req.body;

  if (req.auth.role !== "admin" && user_id !== req.auth.user.id) {
    return res
      .status(403)
      .json({ error: "Cannot create an order for another user" });
  }

  console.log("Status received:", status);

  const validStatuses = [
    "Pending",
    "Confirmed",
    "Packed",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid order status",
    });
  }
  const { data, error } = await supabase
    .from("orders")
    .insert([
      {
        user_id,
        total_amount,
        status,
      },
    ])
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.status(201).json({
    message: "Order Created Successfully",
    order: data,
  });
};

const getOrderById = async (req, res) => {
  const { id } = req.params;

  let query = supabase.from("orders").select("*").eq("id", id);
  if (req.auth.role !== "admin") {
    query = query.eq("user_id", req.auth.user.id);
  }
  const { data, error } = await query.single();

  if (error) {
    return res.status(500).json({
      error: error.message,
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

  if (req.auth.role !== "admin") {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", id)
      .eq("user_id", req.auth.user.id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: "Order not found" });
    }
  }

  const { data, error } = await supabase
    .from("order_items")
    .select(
      `
      id,
      order_id,
      product_id,
      quantity,
      price,
      products:product_id (
        product_name,
        image_url
      )
    `,
    )
    .eq("order_id", id);

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json(data);
};

const updateOrder = async (req, res) => {
  const { id } = req.params;

  const { total_amount, status } = req.body;

  const validStatuses = [
    "Pending",
    "Confirmed",
    "Packed",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid order status",
    });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      total_amount,
      status,
    })
    .eq("id", id)
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message,
    });
  }

  res.json({
    message: "Order Updated Successfully",
    order: data,
  });
};

module.exports = {
  getOrders,
  createOrder,
  getOrderById,
  updateOrder,
  getOrderItems,
};
