const supabase = require("../config/supabase");

const getPayments = async (req, res) => {

  const { data, error } = await supabase
    .from("payments")
    .select("*");

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data);
};

const createPayment = async (req, res) => {

  const {
    order_id,
    amount,
    payment_method,
    payment_status
  } = req.body;

  const { data, error } = await supabase
    .from("payments")
    .insert([
      {
        order_id,
        amount,
        payment_method,
        payment_status
      }
    ])
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.status(201).json({
    message: "Payment Created Successfully",
    payment: data
  });
};

const getPaymentById = async (req, res) => {

  const { id } = req.params;

  const { data, error } = await supabase
    .from("payments")
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

const updatePayment = async (req, res) => {

  const { id } = req.params;

  const {
    amount,
    payment_method,
    payment_status
  } = req.body;

  const { data, error } = await supabase
    .from("payments")
    .update({
      amount,
      payment_method,
      payment_status
    })
    .eq("id", id)
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json({
    message: "Payment Updated Successfully",
    payment: data
  });
};

const deletePayment = async (req, res) => {

  const { id } = req.params;

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json({
    message: `Payment ${id} Deleted Successfully`
  });
};

module.exports = {
  getPayments,
  createPayment,
  getPaymentById,
  updatePayment,
  deletePayment
};