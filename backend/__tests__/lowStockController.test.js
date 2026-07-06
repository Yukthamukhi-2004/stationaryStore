const {
  getLowStockProducts,
  restockProduct,
} = require("../controllers/lowStockController");

// Mock Supabase
jest.mock("../config/supabase", () => {
  const mockModule = {
    from: jest.fn(),
    auth: {},
  };
  return mockModule;
});

const mockSupabase = require("../config/supabase");
const { createQueryBuilderFactory } = require("./helpers/supabaseMock");

function resetMocks() { jest.clearAllMocks(); }

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ═══════════════════════════════════════════════
// GET /low-stock
// ═══════════════════════════════════════════════

describe("getLowStockProducts", () => {
  beforeEach(resetMocks);

  it("returns products below default threshold of 10", async () => {
    const req = { query: {} };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const products = [
      { id: 1, product_name: "Pencil", stock_quantity: 3, price: 5, category_id: 1, image_url: null },
      { id: 2, product_name: "Eraser", stock_quantity: 0, price: 8, category_id: 1, image_url: null },
      { id: 3, product_name: "Pen", stock_quantity: 50, price: 10, category_id: 1, image_url: null },
    ];

    mockSupabase.from.mockImplementation(() => mockBuilder(products));

    await getLowStockProducts(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("products");
    expect(res.json).toHaveBeenCalledWith({
      threshold: 10,
      count: 2,
      products: [
        expect.objectContaining({ product_name: "Eraser", stock_quantity: 0 }),
        expect.objectContaining({ product_name: "Pencil", stock_quantity: 3 }),
      ],
    });
  });

  it("respects custom threshold from query param", async () => {
    const req = { query: { threshold: "5" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const products = [
      { id: 1, product_name: "Pencil", stock_quantity: 3, price: 5, category_id: 1, image_url: null },
      { id: 2, product_name: "Eraser", stock_quantity: 0, price: 8, category_id: 1, image_url: null },
      { id: 3, product_name: "Pen", stock_quantity: 10, price: 10, category_id: 1, image_url: null },
    ];

    mockSupabase.from.mockImplementation(() => mockBuilder(products));

    await getLowStockProducts(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ threshold: 5, count: 2 })
    );
  });

  it("returns empty array when all products have sufficient stock", async () => {
    const req = { query: {} };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const products = [
      { id: 1, product_name: "Pen", stock_quantity: 50, price: 10, category_id: 1, image_url: null },
      { id: 2, product_name: "Book", stock_quantity: 100, price: 50, category_id: 2, image_url: null },
    ];

    mockSupabase.from.mockImplementation(() => mockBuilder(products));

    await getLowStockProducts(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ threshold: 10, count: 0, products: [] })
    );
  });

  it("returns error when Supabase fails", async () => {
    const req = { query: {} };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() => mockBuilder(null, { message: "DB error" }));

    await getLowStockProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
  });
});

// ═══════════════════════════════════════════════
// PUT /low-stock/:id/restock
// ═══════════════════════════════════════════════

describe("restockProduct", () => {
  beforeEach(resetMocks);

  it("restocks a product by adding quantity to its stock", async () => {
    const req = { params: { id: "1" }, body: { quantity: 20 } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Fetch existing product — uses .single()
        return mockBuilder({ id: 1, stock_quantity: 5, product_name: "Pencil" });
      }
      // Update — returns array (no .single())
      return mockBuilder([{ id: 1, stock_quantity: 25, product_name: "Pencil" }]);
    });

    await restockProduct(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "Product restocked successfully. New stock: 25",
      product: expect.objectContaining({ stock_quantity: 25 }),
    });
  });

  it("returns 400 if no quantity provided", async () => {
    const req = { params: { id: "1" }, body: {} };
    const res = mockRes();

    await restockProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Valid quantity is required for restocking",
    });
  });

  it("returns 400 if quantity is zero or negative", async () => {
    const req = { params: { id: "1" }, body: { quantity: 0 } };
    const res = mockRes();

    await restockProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Valid quantity is required for restocking",
    });
  });

  it("returns 404 if product not found", async () => {
    const req = { params: { id: "999" }, body: { quantity: 20 } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    // .single() returns null when product not found
    mockSupabase.from.mockImplementation(() => mockBuilder(null));

    await restockProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Product not found" });
  });

  it("handles null initial stock by treating it as 0", async () => {
    const req = { params: { id: "1" }, body: { quantity: 10 } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Existing product with null stock
        return mockBuilder({ id: 1, stock_quantity: null });
      }
      // Updated product
      return mockBuilder([{ id: 1, stock_quantity: 10 }]);
    });

    await restockProduct(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Product restocked successfully. New stock: 10" })
    );
  });

  it("returns 500 on Supabase fetch error", async () => {
    const req = { params: { id: "1" }, body: { quantity: 20 } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() => mockBuilder(null, { message: "Fetch error" }));

    await restockProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Fetch error" });
  });
});
