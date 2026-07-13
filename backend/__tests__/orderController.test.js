const { getOrders, createOrder, getOrderById, updateOrder } = require("../controllers/orderController");

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

describe("getOrders", () => {
  beforeEach(resetMocks);

  it("returns all orders", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const orders = [
      { id: 1, user_id: "user-1", total_amount: 100, status: "Placed" },
      { id: 2, user_id: "user-2", total_amount: 200, status: "Shipped" },
    ];
    mockSupabase.from.mockImplementation(() => mockBuilder(orders));

    await getOrders(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("orders");
    expect(res.json).toHaveBeenCalledWith(orders);
  });

  it("returns empty array when no orders exist", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() => mockBuilder([]));

    await getOrders(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns 500 on Supabase error", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "DB error" })
    );

    await getOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
  });
});

describe("createOrder", () => {
  beforeEach(resetMocks);

  it("creates an order successfully", async () => {
    const req = {
      body: { user_id: "user-1", total_amount: 150, status: "Pending" },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const newOrder = [{ id: 1, user_id: "user-1", total_amount: 150, status: "Pending" }];
    mockSupabase.from.mockImplementation(() => mockBuilder(newOrder));

    await createOrder(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("orders");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Order Created Successfully",
      order: newOrder,
    });
  });

  it("returns 500 on Supabase error", async () => {
    const req = {
      body: { user_id: "user-1", total_amount: 150, status: "Pending" },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Insert failed" })
    );

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Insert failed" });
  });
});

describe("getOrderById", () => {
  beforeEach(resetMocks);

  it("returns an order by id", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const order = { id: 1, user_id: "user-1", total_amount: 100, status: "Placed" };
    mockSupabase.from.mockImplementation(() => mockBuilder(order));

    await getOrderById(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("orders");
    expect(res.json).toHaveBeenCalledWith(order);
  });

  it("returns 500 on Supabase error", async () => {
    const req = { params: { id: "999" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Fetch error" })
    );

    await getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Fetch error" });
  });
});

describe("updateOrder", () => {
  beforeEach(resetMocks);

  it("updates an order successfully", async () => {
    const req = {
      params: { id: "1" },
      body: { total_amount: 200, status: "Shipped" },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const updated = [{ id: 1, user_id: "user-1", total_amount: 200, status: "Shipped" }];
    mockSupabase.from.mockImplementation(() => mockBuilder(updated));

    await updateOrder(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("orders");
    expect(res.json).toHaveBeenCalledWith({
      message: "Order Updated Successfully",
      order: updated,
    });
  });

  it("returns 500 on Supabase error", async () => {
    const req = {
      params: { id: "1" },
      body: { total_amount: 200, status: "Shipped" },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Update failed" })
    );

    await updateOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Update failed" });
  });
});
