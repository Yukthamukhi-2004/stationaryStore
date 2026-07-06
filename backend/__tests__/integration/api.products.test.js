const request = require("supertest");

jest.mock("../../config/supabase", () => ({
  from: jest.fn(),
  auth: {},
}));

const app = require("../../server");
const mockSupabase = require("../../config/supabase");
const { createQueryBuilderFactory } = require("../helpers/supabaseMock");

describe("Products API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /products", () => {
    it("returns all products", async () => {
      const products = [
        { id: 1, product_name: "Pen", price: 10, stock_quantity: 50, category_id: 1 },
        { id: 2, product_name: "Pencil", price: 5, stock_quantity: 100, category_id: 1 },
      ];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(products));

      const res = await request(app).get("/products");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(products);
    });

    it("returns 500 on Supabase error", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() =>
        builder(null, { message: "DB error" })
      );

      const res = await request(app).get("/products");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "DB error" });
    });
  });

  describe("GET /products/:id", () => {
    it("returns a product by id", async () => {
      const product = { id: 1, product_name: "Pen", price: 10, stock_quantity: 50, category_id: 1 };
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(product));

      const res = await request(app).get("/products/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(product);
    });

    it("returns 404 when product not found", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(null));

      const res = await request(app).get("/products/999");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Product not found" });
    });
  });

  describe("POST /products", () => {
    it("creates a product", async () => {
      const newProduct = [{
        id: 3,
        category_id: 1,
        product_name: "Eraser",
        description: "Rubber eraser",
        price: 8,
        stock_quantity: 200,
        image_url: null,
      }];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(newProduct));

      const res = await request(app)
        .post("/products")
        .send({ category_id: 1, product_name: "Eraser", description: "Rubber eraser", price: 8, stock_quantity: 200 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: "Product Created Successfully",
        product: newProduct,
      });
    });
  });

  describe("PUT /products/:id", () => {
    it("updates a product", async () => {
      const updated = [{
        id: 1,
        category_id: 1,
        product_name: "Updated Pen",
        price: 15,
        stock_quantity: 80,
      }];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(updated));

      const res = await request(app)
        .put("/products/1")
        .send({ product_name: "Updated Pen", price: 15 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Product Updated Successfully",
        product: updated,
      });
    });
  });

  describe("DELETE /products/:id", () => {
    it("deletes a product", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder([]));

      const res = await request(app).delete("/products/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Product Deleted Successfully" });
    });
  });
});

describe("Categories API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /categories", () => {
    it("returns all categories", async () => {
      const categories = [
        { id: 1, name: "Notebooks", description: "Notebooks and diaries" },
        { id: 2, name: "Books", description: "Books and novels" },
      ];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(categories));

      const res = await request(app).get("/categories");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(categories);
    });
  });

  describe("GET /categories/:id", () => {
    it("returns a category by id", async () => {
      const category = { id: 1, name: "Notebooks", description: "Notebooks and diaries" };
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(category));

      const res = await request(app).get("/categories/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(category);
    });

    it("returns 404 when category not found", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(null));

      const res = await request(app).get("/categories/999");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Category not found" });
    });
  });
});
