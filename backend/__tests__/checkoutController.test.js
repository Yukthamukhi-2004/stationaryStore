const { checkout } = require("../controllers/checkoutController");

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

describe("checkout", () => {
  beforeEach(resetMocks);

  it("completes a full checkout successfully", async () => {
    const req = {
      body: {
        user_id: "user-1",
        product_id: 1,
        quantity: 2,
        payment_method: "card",
      },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    // The checkout controller makes 4 sequential Supabase calls:
    // 1. Fetch product → .single()
    // 2. Create order → .select().single()
    // 3. Create order_item (no .select() or .single())
    // 4. Create payment → .select().single()
    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1)
        return mockBuilder({ id: 1, price: 50, product_name: "Pen" });
      if (callCount === 2)
        return mockBuilder({ id: 10, user_id: "user-1", total_amount: 100, status: "Placed" });
      if (callCount === 3)
        return mockBuilder(null); // order_item insert - no return data needed
      if (callCount === 4)
        return mockBuilder({ id: 20, order_id: 10, amount: 100, payment_method: "card", payment_status: "Pending" });
      return mockBuilder(null);
    });

    await checkout(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Checkout Successful",
      order: expect.objectContaining({ id: 10, total_amount: 100 }),
      payment: expect.objectContaining({ id: 20, amount: 100, payment_method: "card" }),
    });
  });

  it("returns 500 when product fetch fails", async () => {
    const req = {
      body: {
        user_id: "user-1",
        product_id: 999,
        quantity: 2,
        payment_method: "card",
      },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Product not found" })
    );

    await checkout(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Product not found" });
  });

  it("returns 500 when order creation fails", async () => {
    const req = {
      body: {
        user_id: "user-1",
        product_id: 1,
        quantity: 2,
        payment_method: "card",
      },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1)
        return mockBuilder({ id: 1, price: 50 });
      if (callCount === 2)
        return mockBuilder(null, { message: "Order creation failed" });
      return mockBuilder(null);
    });

    await checkout(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Order creation failed" });
  });

  it("returns 500 when order item creation fails", async () => {
    const req = {
      body: {
        user_id: "user-1",
        product_id: 1,
        quantity: 2,
        payment_method: "card",
      },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1)
        return mockBuilder({ id: 1, price: 50 });
      if (callCount === 2)
        return mockBuilder({ id: 10, total_amount: 100 });
      if (callCount === 3)
        return mockBuilder(null, { message: "Order item insert failed" });
      return mockBuilder(null);
    });

    await checkout(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Order item insert failed" });
  });

  it("returns 500 when payment creation fails", async () => {
    const req = {
      body: {
        user_id: "user-1",
        product_id: 1,
        quantity: 2,
        payment_method: "card",
      },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1)
        return mockBuilder({ id: 1, price: 50 });
      if (callCount === 2)
        return mockBuilder({ id: 10, total_amount: 100 });
      if (callCount === 3)
        return mockBuilder(null);
      if (callCount === 4)
        return mockBuilder(null, { message: "Payment insert failed" });
      return mockBuilder(null);
    });

    await checkout(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Payment insert failed" });
  });
});
