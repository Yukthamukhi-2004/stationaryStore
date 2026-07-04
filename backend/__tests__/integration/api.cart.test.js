const request = require("supertest");

jest.mock("../../config/supabase", () => ({
  from: jest.fn(),
  auth: {},
}));

const app = require("../../server");
const mockSupabase = require("../../config/supabase");
const { createQueryBuilderFactory } = require("../helpers/supabaseMock");

describe("Carts API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /carts", () => {
    it("returns all carts", async () => {
      const carts = [
        { id: 1, user_id: "user-1" },
        { id: 2, user_id: "user-2" },
      ];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(carts));

      const res = await request(app).get("/carts");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(carts);
    });
  });

  describe("GET /carts/:id", () => {
    it("returns a cart by id", async () => {
      const cart = { id: 1, user_id: "user-1" };
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(cart));

      const res = await request(app).get("/carts/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(cart);
    });
  });

  describe("POST /carts", () => {
    it("creates a cart", async () => {
      const newCart = [{ id: 3, user_id: "user-3" }];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(newCart));

      const res = await request(app)
        .post("/carts")
        .send({ user_id: "user-3" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: "Cart Created Successfully",
        cart: newCart,
      });
    });
  });
});

describe("Cart Items API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /cart-items", () => {
    it("returns all cart items", async () => {
      const items = [
        { id: 1, cart_id: 1, product_id: 1, quantity: 2 },
        { id: 2, cart_id: 1, product_id: 2, quantity: 1 },
      ];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(items));

      const res = await request(app).get("/cart-items");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(items);
    });
  });

  describe("GET /cart-items/:id", () => {
    it("returns a cart item by id", async () => {
      const item = { id: 1, cart_id: 1, product_id: 1, quantity: 2 };
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(item));

      const res = await request(app).get("/cart-items/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(item);
    });
  });

  describe("POST /cart-items", () => {
    it("creates a cart item", async () => {
      const newItem = [{ id: 3, cart_id: 1, product_id: 3, quantity: 5 }];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(newItem));

      const res = await request(app)
        .post("/cart-items")
        .send({ cart_id: 1, product_id: 3, quantity: 5 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: "Cart Item Added Successfully",
        item: newItem,
      });
    });
  });
});

describe("Checkout API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /checkout", () => {
    it("completes a full checkout", async () => {
      const builder = createQueryBuilderFactory();

      // 4 sequential Supabase calls: fetch product → create order → create order_item → create payment
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return builder({ id: 1, price: 50, product_name: "Pen" });
        if (callCount === 2) return builder({ id: 10, user_id: "user-1", total_amount: 100, status: "Placed" });
        if (callCount === 3) return builder(null);
        if (callCount === 4) return builder({ id: 20, order_id: 10, amount: 100, payment_method: "card", payment_status: "Pending" });
        return builder(null);
      });

      const res = await request(app)
        .post("/checkout")
        .send({ user_id: "user-1", product_id: 1, quantity: 2, payment_method: "card" });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Checkout Successful");
      expect(res.body.order).toMatchObject({ id: 10, total_amount: 100 });
      expect(res.body.payment).toMatchObject({ id: 20, amount: 100 });
    });

    it("returns 500 when product fetch fails", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() =>
        builder(null, { message: "Product not found" })
      );

      const res = await request(app)
        .post("/checkout")
        .send({ user_id: "user-1", product_id: 999, quantity: 2, payment_method: "card" });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Product not found" });
    });
  });
});
