const supabase = require("../config/supabase");

const checkout = async (req, res) => {

  const {
    user_id,
    product_id,
    quantity,
    payment_method
  } = req.body;

  // Get Product

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", product_id)
    .single();

  if (productError) {
    return res.status(500).json({
      error: productError.message
    }); 
  }  

  if (quantity > product.stock_quantity) {
    return res.status(400).json({
      message: "Insufficient Stock Available"
    });
  }

  const totalAmount = product.price * quantity;

  // Create Order

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        user_id,
        total_amount: totalAmount,
        status: "Pending"
      }
    ])
    .select()
    .single();

  if (orderError) {
    return res.status(500).json({
      error: orderError.message
    });
  }

  // Create Order Item

  const { error: orderItemError } = await supabase
    .from("order_items")
    .insert([
      {
        order_id: order.id,
        product_id,
        quantity,
        price: product.price
      }
    ]);

  if (orderItemError) {
    return res.status(500).json({
      error: orderItemError.message
    });
  }

  // Create Payment

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert([
      {
        order_id: order.id,
        amount: totalAmount,
        payment_method,
        payment_status: "Pending"
      }
    ])
    .select()
    .single();

  if (paymentError) {
    return res.status(500).json({
      error: paymentError.message
    });
  }

  const { error: stockError } = await supabase
  .from("products")
  .update({
    stock_quantity: product.stock_quantity - quantity
  })
  .eq("id", product_id);

  if (stockError) {
    return res.status(500).json({
      error: stockError.message
    });
  }

  res.status(201).json({
    message: "Checkout Successful",
    order,
    payment
  });
};

module.exports = {
  checkout
};