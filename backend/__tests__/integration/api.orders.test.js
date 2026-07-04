const request = require("supertest");

jest.mock("../../config/supabase", () => ({
  from: jest.fn(),
  auth: {},
}));

const app = require("../../server");
const mockSupabase = require("../../config/supabase");
const { createQueryBuilderFactory } = require("../helpers/supabaseMock");

describe("Orders API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /orders", () => {
    it("returns all orders", async () => {
      const orders = [
        { id: 1, user_id: "user-1", total_amount: 100, status: "Placed" },
        { id: 2, user_id: "user-2", total_amount: 200, status: "Shipped" },
      ];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(orders));

      const res = await request(app).get("/orders");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(orders);
    });

    it("returns 500 on Supabase error", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() =>
        builder(null, { message: "DB error" })
      );

      const res = await request(app).get("/orders");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "DB error" });
    });
  });

  describe("GET /orders/:id", () => {
    it("returns an order by id", async () => {
      const order = { id: 1, user_id: "user-1", total_amount: 100, status: "Placed" };
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(order));

      const res = await request(app).get("/orders/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(order);
    });
  });

  describe("POST /orders", () => {
    it("creates an order", async () => {
      const newOrder = [{ id: 3, user_id: "user-1", total_amount: 150, status: "Placed" }];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(newOrder));

      const res = await request(app)
        .post("/orders")
        .send({ user_id: "user-1", total_amount: 150, status: "Placed" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: "Order Created Successfully",
        order: newOrder,
      });
    });
  });

  describe("PUT /orders/:id", () => {
    it("updates an order", async () => {
      const updated = [{ id: 1, user_id: "user-1", total_amount: 200, status: "Shipped" }];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(updated));

      const res = await request(app)
        .put("/orders/1")
        .send({ total_amount: 200, status: "Shipped" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Order Updated Successfully",
        order: updated,
      });
    });
  });
});

describe("Payments API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /payments", () => {
    it("returns all payments", async () => {
      const payments = [
        { id: 1, order_id: 1, amount: 100, payment_method: "card", payment_status: "Completed" },
        { id: 2, order_id: 2, amount: 200, payment_method: "upi", payment_status: "Pending" },
      ];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(payments));

      const res = await request(app).get("/payments");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(payments);
    });
  });

  describe("GET /payments/:id", () => {
    it("returns a payment by id", async () => {
      const payment = { id: 1, order_id: 1, amount: 100, payment_method: "card", payment_status: "Completed" };
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(payment));

      const res = await request(app).get("/payments/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(payment);
    });
  });

  describe("POST /payments", () => {
    it("creates a payment", async () => {
      const newPayment = [{ id: 3, order_id: 1, amount: 100, payment_method: "card", payment_status: "Pending" }];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(newPayment));

      const res = await request(app)
        .post("/payments")
        .send({ order_id: 1, amount: 100, payment_method: "card", payment_status: "Pending" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: "Payment Created Successfully",
        payment: newPayment,
      });
    });
  });

  describe("PUT /payments/:id", () => {
    it("updates a payment", async () => {
      const updated = [{ id: 1, order_id: 1, amount: 150, payment_method: "upi", payment_status: "Completed" }];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(updated));

      const res = await request(app)
        .put("/payments/1")
        .send({ amount: 150, payment_method: "upi", payment_status: "Completed" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Payment Updated Successfully",
        payment: updated,
      });
    });
  });

  describe("DELETE /payments/:id", () => {
    it("deletes a payment", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder([]));

      const res = await request(app).delete("/payments/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Payment 1 Deleted Successfully" });
    });
  });
});
