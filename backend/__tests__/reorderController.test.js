const {
  getReorderSuggestions,
  bulkRestock,
} = require("../controllers/reorderController");

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
// GET /reorder/suggestions
// ═══════════════════════════════════════════════

describe("getReorderSuggestions", () => {
  beforeEach(resetMocks);

  it("returns reorder suggestions with estimated costs", async () => {
    const req = { query: {} };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const products = [
      { id: 1, product_name: "Pencil", price: 5, stock_quantity: 3, category_id: 1 },
      { id: 2, product_name: "Pen", price: 10, stock_quantity: 50, category_id: 1 },
      { id: 3, product_name: "Eraser", price: 8, stock_quantity: 0, category_id: 1 },
    ];

    mockSupabase.from.mockImplementation(() => mockBuilder(products));

    await getReorderSuggestions(req, res);

    // Default threshold is 20 — only Pencil(3) and Eraser(0) are <= 20
    // Pencil: suggested = max(20*2-3, 20) = 37, cost = 37*5 = 185
    // Eraser: suggested = max(40-0, 20) = 40, cost = 40*8 = 320
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        threshold: 20,
        count: 2,
        total_estimated_cost: 505,
        suggestions: expect.arrayContaining([
          expect.objectContaining({ product_name: "Pencil", current_stock: 3, suggested_reorder_qty: 37, estimated_cost: 185 }),
          expect.objectContaining({ product_name: "Eraser", current_stock: 0, suggested_reorder_qty: 40, estimated_cost: 320 }),
        ]),
      })
    );
  });

  it("respects custom threshold from query param", async () => {
    const req = { query: { threshold: "10" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const products = [
      { id: 1, product_name: "Pencil", price: 5, stock_quantity: 3, category_id: 1 },
      { id: 2, product_name: "Pen", price: 10, stock_quantity: 15, category_id: 1 },
      { id: 3, product_name: "Eraser", price: 8, stock_quantity: 0, category_id: 1 },
    ];

    mockSupabase.from.mockImplementation(() => mockBuilder(products));

    await getReorderSuggestions(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ threshold: 10, count: 2 })
    );
  });

  it("returns empty suggestions when all stock is sufficient", async () => {
    const req = { query: {} };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const products = [
      { id: 1, product_name: "Pen", price: 10, stock_quantity: 100, category_id: 1 },
      { id: 2, product_name: "Book", price: 50, stock_quantity: 50, category_id: 2 },
    ];

    mockSupabase.from.mockImplementation(() => mockBuilder(products));

    await getReorderSuggestions(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ threshold: 20, count: 0, suggestions: [] })
    );
  });

  it("excludes null stock from suggestions since SQL lte excludes NULL", async () => {
    const req = { query: {} };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    // In PostgreSQL, NULL <= threshold evaluates to NULL (not TRUE), so Supabase excludes them.
    const products = [
      { id: 1, product_name: "Notebook", price: 45, stock_quantity: null, category_id: 1 },
    ];

    mockSupabase.from.mockImplementation(() => mockBuilder(products));

    await getReorderSuggestions(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 0,
        suggestions: [],
      })
    );
  });
});

// ═══════════════════════════════════════════════
// POST /reorder/bulk-restock
// ═══════════════════════════════════════════════

describe("bulkRestock", () => {
  beforeEach(resetMocks);

  it("bulk restocks multiple products successfully", async () => {
    const req = {
      body: {
        items: [
          { product_id: 1, quantity: 10 },
          { product_id: 2, quantity: 20 },
        ],
      },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    // The controller processes items sequentially: fetch → update → fetch → update
    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockBuilder({ id: 1, stock_quantity: 5 });      // item 1 fetch
      if (callCount === 2) return mockBuilder([{ id: 1, stock_quantity: 15 }]);   // item 1 update
      if (callCount === 3) return mockBuilder({ id: 2, stock_quantity: 10 });      // item 2 fetch
      if (callCount === 4) return mockBuilder([{ id: 2, stock_quantity: 30 }]);   // item 2 update
      return mockBuilder([]);
    });

    await bulkRestock(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "Bulk restock completed. 2 succeeded, 0 failed.",
      results: [
        { product_id: 1, new_stock: 15, message: "Restocked by 10" },
        { product_id: 2, new_stock: 30, message: "Restocked by 20" },
      ],
      errors: undefined,
    });
  });

  it("returns 400 when items array is missing", async () => {
    const req = { body: {} };
    const res = mockRes();

    await bulkRestock(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Items array is required with product_id and quantity",
    });
  });

  it("returns 400 when items array is empty", async () => {
    const req = { body: { items: [] } };
    const res = mockRes();

    await bulkRestock(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Items array is required with product_id and quantity",
    });
  });

  it("handles partial failures", async () => {
    const req = {
      body: {
        items: [
          { product_id: 1, quantity: 10 },
          { product_id: 999, quantity: 20 },
        ],
      },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    // Controller processes: item 1 fetch → check → item 1 update → item 2 fetch → (fails) → skip update
    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockBuilder({ id: 1, stock_quantity: 5 });     // item 1 fetch
      if (callCount === 2) return mockBuilder([{ id: 1, stock_quantity: 15 }]);   // item 1 update
      if (callCount === 3) return mockBuilder(null);                              // item 2 fetch — not found
      return mockBuilder([]);
    });

    await bulkRestock(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "Bulk restock completed. 1 succeeded, 1 failed.",
      results: [
        { product_id: 1, new_stock: 15, message: "Restocked by 10" },
      ],
      errors: [
        { product_id: 999, error: "Product not found" },
      ],
    });
  });

  it("handles invalid items in the array", async () => {
    const req = {
      body: {
        items: [
          { product_id: 1, quantity: 10 },
          { product_id: null, quantity: -5 },
          { product_id: 3, quantity: 0 },
        ],
      },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockBuilder({ id: 1, stock_quantity: 5 });
      if (callCount === 2) return mockBuilder([{ id: 1, stock_quantity: 15 }]);
      return mockBuilder([]);
    });

    await bulkRestock(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Bulk restock completed. 1 succeeded, 2 failed.",
        results: expect.arrayContaining([
          expect.objectContaining({ product_id: 1 }),
        ]),
      })
    );
  });
});
