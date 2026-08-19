const request = require("supertest");

jest.mock("../../config/supabase", () => ({
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
}));

const app = require("../../server");
const mockSupabase = require("../../config/supabase");
const { createQueryBuilderFactory } = require("../helpers/supabaseMock");

describe("Admin Auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /admin/verify", () => {
    it("verifies an admin user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "auth-123", email: "admin@example.com" } },
        error: null,
      });

      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() =>
        builder({ id: 1, user_id: "auth-123", role: "admin", name: "Admin" })
      );

      const res = await request(app)
        .post("/admin/verify")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.authorized).toBe(true);
      expect(res.body.user.email).toBe("admin@example.com");
    });

    it("rejects non-admin users", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "auth-456", email: "user@example.com" } },
        error: null,
      });

      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() =>
        builder({ id: 2, user_id: "auth-456", role: "user" })
      );

      const res = await request(app)
        .post("/admin/verify")
        .set("Authorization", "Bearer user-token");

      expect(res.status).toBe(403);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.authorized).toBe(false);
      expect(res.body.error).toBe("User does not have admin privileges");
    });
  });
});

describe("Dashboard API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /dashboard/stats", () => {
    it("returns aggregate store stats", async () => {
      const builder = createQueryBuilderFactory();
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return builder([{ id: 1 }, { id: 2 }]);
        if (callCount === 2) return builder([{ id: 1 }, { id: 2 }, { id: 3 }]);
        if (callCount === 3) return builder([{ id: 1 }, { id: 2 }]);
        return builder([]);
      });

      const res = await request(app).get("/dashboard/stats");

      expect(res.status).toBe(200);
      expect(res.body.total_orders).toBe(2);
      expect(res.body.total_products).toBe(3);
      expect(res.body.total_categories).toBe(2);
    });
  });

  describe("GET /dashboard/revenue-analytics", () => {
    it("returns revenue analytics", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() =>
        builder([{ amount: 100, payment_method: "card", payment_status: "completed" }])
      );

      const res = await request(app).get("/dashboard/revenue-analytics");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("total_revenue");
      expect(res.body).toHaveProperty("monthly");
      expect(res.body).toHaveProperty("payment_method_breakdown");
    });
  });

  describe("GET /dashboard/order-analytics", () => {
    it("returns order analytics", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() =>
        builder([
          { id: 1, total_amount: 100, status: "Placed", created_at: "2024-01-01" },
          { id: 2, total_amount: 200, status: "Shipped", created_at: "2024-01-02" },
        ])
      );

      const res = await request(app).get("/dashboard/order-analytics");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("total_orders");
      expect(res.body).toHaveProperty("status_distribution");
    });
  });

  describe("GET /dashboard/inventory-analytics", () => {
    it("returns inventory analytics", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() =>
        builder([
          { id: 1, stock_quantity: 50, price: 10 },
          { id: 2, stock_quantity: 3, price: 5 },
          { id: 3, stock_quantity: 0, price: 8 },
        ])
      );

      const res = await request(app).get("/dashboard/inventory-analytics");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("total_stock");
      expect(res.body).toHaveProperty("low_stock_count");
    });
  });
});

describe("Low Stock API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /low-stock", () => {
    it("returns products below threshold", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() =>
        builder([
          { id: 1, product_name: "Pencil", stock_quantity: 3, price: 5, category_id: 1, image_url: null },
          { id: 2, product_name: "Eraser", stock_quantity: 0, price: 8, category_id: 1, image_url: null },
          { id: 3, product_name: "Pen", stock_quantity: 50, price: 10, category_id: 1, image_url: null },
        ])
      );

      const res = await request(app).get("/low-stock");

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.products).toHaveLength(2);
    });
  });

  describe("PUT /low-stock/:id/restock", () => {
    it("restocks a product", async () => {
      const builder = createQueryBuilderFactory();
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return builder({ id: 1, stock_quantity: 5, product_name: "Pencil" });
        return builder([{ id: 1, stock_quantity: 25, product_name: "Pencil" }]);
      });

      const res = await request(app)
        .put("/low-stock/1/restock")
        .send({ quantity: 20 });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("New stock: 25");
    });
  });
});

describe("Reorder API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /reorder/suggestions", () => {
    it("returns reorder suggestions", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() =>
        builder([
          { id: 1, product_name: "Pencil", price: 5, stock_quantity: 3, category_id: 1 },
          { id: 2, product_name: "Pen", price: 10, stock_quantity: 50, category_id: 1 },
          { id: 3, product_name: "Eraser", price: 8, stock_quantity: 0, category_id: 1 },
        ])
      );

      const res = await request(app).get("/reorder/suggestions");

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body).toHaveProperty("total_estimated_cost");
    });
  });

  describe("POST /reorder/bulk-restock", () => {
    it("bulk restocks products", async () => {
      const builder = createQueryBuilderFactory();
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return builder({ id: 1, stock_quantity: 5 });
        if (callCount === 2) return builder([{ id: 1, stock_quantity: 15 }]);
        if (callCount === 3) return builder({ id: 2, stock_quantity: 10 });
        if (callCount === 4) return builder([{ id: 2, stock_quantity: 30 }]);
        return builder([]);
      });

      const res = await request(app)
        .post("/reorder/bulk-restock")
        .send({ items: [{ product_id: 1, quantity: 10 }, { product_id: 2, quantity: 20 }] });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("2 succeeded");
    });
  });
});
