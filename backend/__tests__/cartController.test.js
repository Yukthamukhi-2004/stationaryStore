const {
  getCarts,
  createCart,
  getCartById,
} = require("../controllers/cartController");

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

describe("getCarts", () => {
  beforeEach(resetMocks);

  it("returns all carts", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const carts = [
      { id: 1, user_id: "user-1" },
      { id: 2, user_id: "user-2" },
    ];
    mockSupabase.from.mockImplementation(() => mockBuilder(carts));

    await getCarts(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("cart");
    expect(res.json).toHaveBeenCalledWith(carts);
  });

  it("returns empty array when no carts exist", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() => mockBuilder([]));

    await getCarts(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns 500 on Supabase error", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "DB error" })
    );

    await getCarts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
  });
});

describe("createCart", () => {
  beforeEach(resetMocks);

  it("creates a cart successfully", async () => {
    const req = { body: { user_id: "user-1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const newCart = [{ id: 1, user_id: "user-1" }];
    mockSupabase.from.mockImplementation(() => mockBuilder(newCart));

    await createCart(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("cart");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Cart Created Successfully",
      cart: newCart,
    });
  });

  it("returns 500 on Supabase error", async () => {
    const req = { body: { user_id: "user-1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Insert failed" })
    );

    await createCart(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Insert failed" });
  });
});

describe("getCartById", () => {
  beforeEach(resetMocks);

  it("returns a cart by id", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const cart = { id: 1, user_id: "user-1" };
    mockSupabase.from.mockImplementation(() => mockBuilder(cart));

    await getCartById(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("cart");
    expect(res.json).toHaveBeenCalledWith(cart);
  });

  it("returns 500 on Supabase error", async () => {
    const req = { params: { id: "999" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Fetch error" })
    );

    await getCartById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Fetch error" });
  });
});
