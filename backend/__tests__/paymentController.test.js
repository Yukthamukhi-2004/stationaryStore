const {
  getPayments,
  createPayment,
  getPaymentById,
  updatePayment,
  deletePayment,
} = require("../controllers/paymentController");

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

describe("getPayments", () => {
  beforeEach(resetMocks);

  it("returns all payments", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const payments = [
      { id: 1, order_id: 1, amount: 100, payment_method: "card", payment_status: "Completed" },
      { id: 2, order_id: 2, amount: 200, payment_method: "upi", payment_status: "Pending" },
    ];
    mockSupabase.from.mockImplementation(() => mockBuilder(payments));

    await getPayments(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("payments");
    expect(res.json).toHaveBeenCalledWith(payments);
  });

  it("returns empty array when no payments exist", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() => mockBuilder([]));

    await getPayments(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns 500 on Supabase error", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "DB error" })
    );

    await getPayments(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
  });
});

describe("createPayment", () => {
  beforeEach(resetMocks);

  it("creates a payment successfully", async () => {
    const req = {
      body: { order_id: 1, amount: 100, payment_method: "card", payment_status: "Pending" },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const newPayment = [{ id: 1, order_id: 1, amount: 100, payment_method: "card", payment_status: "Pending" }];
    mockSupabase.from.mockImplementation(() => mockBuilder(newPayment));

    await createPayment(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("payments");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Payment Created Successfully",
      payment: newPayment,
    });
  });

  it("returns 500 on Supabase error", async () => {
    const req = {
      body: { order_id: 1, amount: 100, payment_method: "card", payment_status: "Pending" },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Insert failed" })
    );

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Insert failed" });
  });
});

describe("getPaymentById", () => {
  beforeEach(resetMocks);

  it("returns a payment by id", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const payment = { id: 1, order_id: 1, amount: 100, payment_method: "card", payment_status: "Completed" };
    mockSupabase.from.mockImplementation(() => mockBuilder(payment));

    await getPaymentById(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("payments");
    expect(res.json).toHaveBeenCalledWith(payment);
  });

  it("returns 500 on Supabase error", async () => {
    const req = { params: { id: "999" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Fetch error" })
    );

    await getPaymentById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Fetch error" });
  });
});

describe("updatePayment", () => {
  beforeEach(resetMocks);

  it("updates a payment successfully", async () => {
    const req = {
      params: { id: "1" },
      body: { amount: 150, payment_method: "upi", payment_status: "Completed" },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const updated = [{ id: 1, order_id: 1, amount: 150, payment_method: "upi", payment_status: "Completed" }];
    mockSupabase.from.mockImplementation(() => mockBuilder(updated));

    await updatePayment(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("payments");
    expect(res.json).toHaveBeenCalledWith({
      message: "Payment Updated Successfully",
      payment: updated,
    });
  });

  it("returns 500 on Supabase error", async () => {
    const req = {
      params: { id: "1" },
      body: { amount: 150, payment_method: "upi", payment_status: "Completed" },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Update failed" })
    );

    await updatePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Update failed" });
  });
});

describe("deletePayment", () => {
  beforeEach(resetMocks);

  it("deletes a payment successfully", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() => mockBuilder([]));

    await deletePayment(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("payments");
    expect(res.json).toHaveBeenCalledWith({
      message: "Payment 1 Deleted Successfully",
    });
  });

  it("returns 500 on Supabase error", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Delete failed" })
    );

    await deletePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Delete failed" });
  });
});
