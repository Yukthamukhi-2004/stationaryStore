const {
  getCartItems,
  createCartItem,
  getCartItemById,
  updateCartItem,
} = require("../controllers/cartItemController");

jest.mock("../config/supabase", () => ({
  from: jest.fn(),
  auth: {},
}));

const mockSupabase = require("../config/supabase");
const { createQueryBuilderFactory } = require("./helpers/supabaseMock");

function resetMocks() {
  jest.clearAllMocks();
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("getCartItems", () => {
  beforeEach(resetMocks);

  it("returns all cart items", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const items = [
      { id: 1, cart_id: 1, product_id: 1, quantity: 2 },
      { id: 2, cart_id: 1, product_id: 2, quantity: 1 },
    ];
    mockSupabase.from.mockImplementation(() => mockBuilder(items));

    await getCartItems(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("cart_items");
    expect(res.json).toHaveBeenCalledWith(items);
  });

  it("returns empty array when no items exist", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() => mockBuilder([]));

    await getCartItems(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns 500 on Supabase error", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "DB error" }),
    );

    await getCartItems(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
  });
});

describe("createCartItem", () => {
  beforeEach(resetMocks);

  it("creates a cart item successfully", async () => {
    const req = { body: { cart_id: 1, product_id: 1, quantity: 3 } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const newItem = [{ id: 1, cart_id: 1, product_id: 1, quantity: 3 }];
    mockSupabase.from.mockImplementation(() => mockBuilder(newItem));

    await createCartItem(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("cart_items");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Cart Item Added Successfully",
      item: newItem,
    });
  });

  it("returns 500 on Supabase error", async () => {
    const req = { body: { cart_id: 1, product_id: 1, quantity: 3 } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Insert failed" }),
    );

    await createCartItem(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Insert failed" });
  });

  it("rejects an addition that exceeds remaining product stock", async () => {
    const req = { body: { cart_id: 1, product_id: 1, quantity: 2 } };
    const res = mockRes();
    mockSupabase.from.mockImplementation((table) => {
      if (table === "products") {
        return createQueryBuilderFactory()({ id: 1, stock_quantity: 2 });
      }
      return createQueryBuilderFactory()([
        { cart_id: 1, product_id: 1, quantity: 1 },
      ]);
    });

    await createCartItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Only 1 more available",
    });
    expect(mockSupabase.from).toHaveBeenCalledTimes(2);
  });
});

describe("updateCartItem stock validation", () => {
  beforeEach(resetMocks);

  it("rejects an update that would exceed stock across cart rows", async () => {
    const req = { params: { id: "9" }, body: { quantity: 2 } };
    const res = mockRes();
    let cartItemsCalls = 0;
    mockSupabase.from.mockImplementation((table) => {
      if (table === "products") {
        return createQueryBuilderFactory()({ id: 1, stock_quantity: 2 });
      }
      cartItemsCalls += 1;
      if (cartItemsCalls === 1) {
        return createQueryBuilderFactory()({
          id: 9,
          cart_id: 1,
          product_id: 1,
          quantity: 1,
        });
      }
      return createQueryBuilderFactory()([
        { id: 9, cart_id: 1, product_id: 1, quantity: 1 },
        { id: 10, cart_id: 1, product_id: 1, quantity: 1 },
      ]);
    });

    await updateCartItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Only 1 available",
    });
    expect(cartItemsCalls).toBe(2);
  });

  it("allows quantity decreases after stock has been reduced", async () => {
    const req = { params: { id: "9" }, body: { quantity: 2 } };
    const res = mockRes();
    let cartItemsCalls = 0;
    mockSupabase.from.mockImplementation((table) => {
      if (table === "products") {
        return createQueryBuilderFactory()({ id: 1, stock_quantity: 2 });
      }
      cartItemsCalls += 1;
      if (cartItemsCalls === 1) {
        return createQueryBuilderFactory()({
          id: 9,
          cart_id: 1,
          product_id: 1,
          quantity: 3,
        });
      }
      if (cartItemsCalls === 2) {
        return createQueryBuilderFactory()([
          { id: 9, cart_id: 1, product_id: 1, quantity: 3 },
        ]);
      }
      return createQueryBuilderFactory()([
        { id: 9, cart_id: 1, product_id: 1, quantity: 2 },
      ]);
    });

    await updateCartItem(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "Cart item updated successfully",
      item: { id: 9, cart_id: 1, product_id: 1, quantity: 2 },
    });
  });
});

describe("getCartItemById", () => {
  beforeEach(resetMocks);

  it("returns a cart item by id", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const item = { id: 1, cart_id: 1, product_id: 1, quantity: 2 };
    mockSupabase.from.mockImplementation(() => mockBuilder(item));

    await getCartItemById(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("cart_items");
    expect(res.json).toHaveBeenCalledWith(item);
  });

  it("returns 500 on Supabase error", async () => {
    const req = { params: { id: "999" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Fetch error" }),
    );

    await getCartItemById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Fetch error" });
  });
});
