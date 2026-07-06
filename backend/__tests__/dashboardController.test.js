const {
  getDashboardStats,
  getRevenueAnalytics,
  getOrderAnalytics,
  getInventoryAnalytics,
} = require("../controllers/dashboardController");

// Mock Supabase
jest.mock("../config/supabase", () => {
  // We build the mock lazily so we can reconfigure it per test
  const mockModule = {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      setSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  };
  return mockModule;
});

const mockSupabase = require("../config/supabase");

// ── Helper: create a chainable query builder with controlled return ──
function mockQuery(returnData, error = null) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    then: undefined,

    // Make the query thenable (async iterable for Promise.all)
    [Symbol.iterator]() {
      let resolved = false;
      return {
        next: () => {
          if (!resolved) {
            resolved = true;
            return { value: { data: returnData, error }, done: false };
          }
          return { done: true };
        },
      };
    },
  };

  // Make it thenable for await
  chain.then = (resolve) =>
    Promise.resolve({ data: returnData, error }).then(resolve);

  return chain;
}

function mockEmptyTable() {
  return mockQuery([]);
}

function mockError(message) {
  return mockQuery(null, { message });
}

function resetMocks() {
  jest.clearAllMocks();
}

// ── Reusable mock response object ──
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ═══════════════════════════════════════════════
// Dashboard Stats
// ═══════════════════════════════════════════════

describe("getDashboardStats", () => {
  beforeEach(resetMocks);

  it("returns aggregated stats from all tables", async () => {
    const req = {};
    const res = mockRes();

    // Configure mock returns for each table
    const mockOrders = [
      { id: 1, status: "Placed", total_amount: 100 },
      { id: 2, status: "Delivered", total_amount: 200 },
      { id: 3, status: "Delivered", total_amount: 150 },
    ];
    const mockProducts = [
      { id: 1, product_name: "Pen", price: 10 },
      { id: 2, product_name: "Book", price: 50 },
    ];
    const mockCategories = [
      { id: 1, name: "Notebooks" },
      { id: 2, name: "Books" },
    ];
    const mockPayments = [
      { id: 1, order_id: 1, amount: 100, payment_status: "completed" },
      { id: 2, order_id: 2, amount: 200, payment_status: "completed" },
      { id: 3, order_id: 3, amount: 150, payment_status: "pending" },
    ];

    // Simulate 4 parallel calls to supabase.from(...).select("*")
    // We'll mock .from() to return a chain that resolves to the right table data
    mockSupabase.from.mockImplementation((table) => {
      if (table === "orders") return mockQuery(mockOrders);
      if (table === "products") return mockQuery(mockProducts);
      if (table === "categories") return mockQuery(mockCategories);
      if (table === "payments") return mockQuery(mockPayments);
      return mockEmptyTable();
    });

    await getDashboardStats(req, res);

    expect(res.json).toHaveBeenCalledWith({
      total_orders: 3,
      total_products: 2,
      total_categories: 2,
      total_revenue: 300, // only completed payments: 100 + 200
      completed_payments: 2,
      order_status_breakdown: { Placed: 1, Delivered: 2 },
      dealer_invoice_count: 0,
      customer_invoice_count: 3,
      stock_purchase_count: 0,
      stock_purchase_value: 0,
    });
  });

  it("returns 0 values when all tables are empty", async () => {
    const req = {};
    const res = mockRes();

    mockSupabase.from.mockImplementation(() => mockEmptyTable());

    await getDashboardStats(req, res);

    expect(res.json).toHaveBeenCalledWith({
      total_orders: 0,
      total_products: 0,
      total_categories: 0,
      total_revenue: 0,
      completed_payments: 0,
      order_status_breakdown: {},
      dealer_invoice_count: 0,
      customer_invoice_count: 0,
      stock_purchase_count: 0,
      stock_purchase_value: 0,
    });
  });

  it("returns 500 on Supabase error", async () => {
    const req = {};
    const res = mockRes();

    mockSupabase.from.mockImplementation(() =>
      mockQuery(null, { message: "DB connection failed" })
    );

    await getDashboardStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "DB connection failed",
    });
  });

  it("only counts completed payments for revenue", async () => {
    const req = {};
    const res = mockRes();

    mockSupabase.from.mockImplementation((table) => {
      if (table === "orders") return mockQuery([{ id: 1, status: "Placed", total_amount: 100 }]);
      if (table === "products") return mockQuery([{ id: 1, product_name: "Pen", price: 10 }]);
      if (table === "categories") return mockQuery([{ id: 1, name: "Books" }]);
      if (table === "payments")
        return mockQuery([
          { id: 1, order_id: 1, amount: 100, payment_status: "completed" },
          { id: 2, order_id: 1, amount: 50, payment_status: "pending" },
          { id: 3, order_id: 1, amount: 25, payment_status: "failed" },
        ]);
      return mockEmptyTable();
    });

    await getDashboardStats(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        total_revenue: 100,
        completed_payments: 1,
      })
    );
  });
});

// ═══════════════════════════════════════════════
// Revenue Analytics
// ═══════════════════════════════════════════════

describe("getRevenueAnalytics", () => {
  beforeEach(resetMocks);

  it("returns monthly revenue grouped by month", async () => {
    const req = {};
    const res = mockRes();

    const payments = [
      { id: 1, amount: 100, payment_status: "completed", payment_method: "upi", created_at: "2024-01-15T00:00:00Z" },
      { id: 2, amount: 200, payment_status: "completed", payment_method: "cod", created_at: "2024-01-20T00:00:00Z" },
      { id: 3, amount: 150, payment_status: "completed", payment_method: "upi", created_at: "2024-02-10T00:00:00Z" },
      { id: 4, amount: 50, payment_status: "pending", payment_method: "cod", created_at: "2024-02-15T00:00:00Z" },
    ];

    mockSupabase.from.mockImplementation((table) => {
      if (table === "payments")
        return mockQuery(payments);
      return mockEmptyTable();
    });

    await getRevenueAnalytics(req, res);

    expect(res.json).toHaveBeenCalledWith({
      total_revenue: 450,
      monthly: [
        { month: "2024-01", revenue: 300 },
        { month: "2024-02", revenue: 150 },
      ],
      payment_method_breakdown: { upi: 2, cod: 2 },
    });
  });

  it("returns empty monthly when no completed payments", async () => {
    const req = {};
    const res = mockRes();

    mockSupabase.from.mockImplementation((table) => {
      if (table === "payments")
        return mockQuery([
          { id: 1, amount: 100, payment_status: "pending", payment_method: "upi", created_at: "2024-01-15T00:00:00Z" },
        ]);
      return mockEmptyTable();
    });

    await getRevenueAnalytics(req, res);

    expect(res.json).toHaveBeenCalledWith({
      total_revenue: 0,
      monthly: [],
      payment_method_breakdown: { upi: 1 },
    });
  });

  it("returns 500 on Supabase error", async () => {
    const req = {};
    const res = mockRes();

    mockSupabase.from.mockImplementation(() =>
      mockQuery(null, { message: "Query timeout" })
    );

    await getRevenueAnalytics(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Query timeout",
    });
  });
});

// ═══════════════════════════════════════════════
// Order Analytics
// ═══════════════════════════════════════════════

describe("getOrderAnalytics", () => {
  beforeEach(resetMocks);

  it("returns order analytics with monthly trends", async () => {
    const req = {};
    const res = mockRes();

    const orders = [
      { id: 1, total_amount: 100, status: "Placed", created_at: "2024-01-10T00:00:00Z" },
      { id: 2, total_amount: 200, status: "Delivered", created_at: "2024-01-20T00:00:00Z" },
      { id: 3, total_amount: 150, status: "Delivered", created_at: "2024-02-05T00:00:00Z" },
    ];

    mockSupabase.from.mockImplementation((table) => {
      if (table === "orders") return mockQuery(orders);
      return mockEmptyTable();
    });

    await getOrderAnalytics(req, res);

    expect(res.json).toHaveBeenCalledWith({
      total_orders: 3,
      average_order_value: 150,
      monthly: [
        { month: "2024-01", count: 2 },
        { month: "2024-02", count: 1 },
      ],
      status_distribution: { Placed: 1, Delivered: 2 },
    });
  });

  it("returns 0 avg order value when no orders", async () => {
    const req = {};
    const res = mockRes();

    mockSupabase.from.mockImplementation(() => mockEmptyTable());

    await getOrderAnalytics(req, res);

    expect(res.json).toHaveBeenCalledWith({
      total_orders: 0,
      average_order_value: 0,
      monthly: [],
      status_distribution: {},
    });
  });
});

// ═══════════════════════════════════════════════
// Inventory Analytics
// ═══════════════════════════════════════════════

describe("getInventoryAnalytics", () => {
  beforeEach(resetMocks);

  it("returns inventory analytics with low stock items", async () => {
    const req = {};
    const res = mockRes();

    const products = [
      { id: 1, product_name: "Pen", price: 10, stock_quantity: 50 },
      { id: 2, product_name: "Pencil", price: 5, stock_quantity: 3 },
      { id: 3, product_name: "Eraser", price: 8, stock_quantity: 0 },
      { id: 4, product_name: "Notebook", price: 45, stock_quantity: null },
    ];

    mockSupabase.from.mockImplementation((table) => {
      if (table === "products") return mockQuery(products);
      return mockEmptyTable();
    });

    await getInventoryAnalytics(req, res);

    expect(res.json).toHaveBeenCalledWith({
      total_products: 4,
      total_stock: 53, // 50 + 3 + 0 + 0 (null treated as 0)
      low_stock_count: 2, // Pencil(3) and Eraser(0)
      out_of_stock_count: 2, // Eraser(0) and Notebook(null)
      average_price: 17, // (10 + 5 + 8 + 45) / 4
      low_stock_items: expect.arrayContaining([
        expect.objectContaining({ product_name: "Pencil", stock_quantity: 3 }),
        expect.objectContaining({ product_name: "Eraser", stock_quantity: 0 }),
      ]),
    });
  });

  it("returns 0 values when no products", async () => {
    const req = {};
    const res = mockRes();

    mockSupabase.from.mockImplementation(() => mockEmptyTable());

    await getInventoryAnalytics(req, res);

    expect(res.json).toHaveBeenCalledWith({
      total_products: 0,
      total_stock: 0,
      low_stock_count: 0,
      out_of_stock_count: 0,
      average_price: 0,
      low_stock_items: [],
    });
  });
});
