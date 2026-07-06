const supabase = require("../config/supabase");

/**
 * GET /api/purchases
 * Returns all purchases ordered by created_at descending
 */
const getPurchases = async (req, res) => {
  try {
    const { type, dealer_name, date_from, date_to, page, per_page } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const perPage = Math.min(10000, Math.max(1, parseInt(per_page) || 20));
    const start = (pageNum - 1) * perPage;
    const end = start + perPage - 1;

    let query = supabase.from("purchases").select("*", { count: "exact" });

    if (type && ["dealer_invoice", "stock_purchase"].includes(type)) {
      query = query.eq("type", type);
    }

    if (dealer_name) {
      query = query.ilike("dealer_name", `%${dealer_name}%`);
    }

    if (date_from) {
      query = query.gte("created_at", date_from);
    }

    if (date_to) {
      // Include the end of the selected day
      query = query.lte("created_at", `${date_to}T23:59:59.999Z`);
    }

    query = query.order("created_at", { ascending: false });
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) {
      // Check if error is because the table doesn't exist
      if (error.message && error.message.includes("Could not find the table")) {
        return res.json({ data: [], pagination: { page: 1, per_page: perPage, total: 0, total_pages: 0 } });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({
      data,
      pagination: {
        page: pageNum,
        per_page: perPage,
        total: count || 0,
        total_pages: count ? Math.ceil(count / perPage) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/purchases/:id
 * Returns a single purchase by ID
 */
const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("purchases")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.message && error.message.includes("Could not find the table")) {
        return res.status(404).json({ error: "Purchase not found" });
      }
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/purchases
 * Creates a new purchase record
 */
const createPurchase = async (req, res) => {
  try {
    const { type, dealer_name, invoice_number, description, amount } = req.body;

    if (!type || !["dealer_invoice", "stock_purchase"].includes(type)) {
      return res.status(400).json({ error: "Valid type is required (dealer_invoice or stock_purchase)" });
    }

    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) < 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    const { data, error } = await supabase
      .from("purchases")
      .insert([
        {
          type,
          dealer_name: dealer_name || null,
          invoice_number: invoice_number || null,
          description: description || null,
          amount: Number(amount),
        },
      ])
      .select();

    if (error) {
      if (error.message && error.message.includes("Could not find the table")) {
        return res.status(500).json({
          error: "The 'purchases' table does not exist yet. Please run supabase-schema.sql in your Supabase Dashboard SQL Editor first.",
          hint: "Open https://supabase.com/dashboard/project/ukdeegsxgabnbxtctzgk/sql/new and paste the CREATE TABLE statement from supabase-schema.sql",
        });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
      message: "Purchase created successfully",
      purchase: data[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/purchases/:id
 * Updates an existing purchase record
 */
const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, dealer_name, invoice_number, description, amount } = req.body;

    const updates = {};

    if (type !== undefined) {
      if (!["dealer_invoice", "stock_purchase"].includes(type)) {
        return res.status(400).json({ error: "Valid type is required (dealer_invoice or stock_purchase)" });
      }
      updates.type = type;
    }

    if (dealer_name !== undefined) updates.dealer_name = dealer_name || null;
    if (invoice_number !== undefined) updates.invoice_number = invoice_number || null;
    if (description !== undefined) updates.description = description || null;
    if (amount !== undefined) {
      if (isNaN(Number(amount)) || Number(amount) < 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }
      updates.amount = Number(amount);
    }

    const { data, error } = await supabase
      .from("purchases")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    res.json({
      message: "Purchase updated successfully",
      purchase: data[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/purchases/:id
 * Deletes a purchase record
 */
const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("purchases").delete().eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Purchase deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
};
