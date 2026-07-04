const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

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

describe("getProducts", () => {
  beforeEach(resetMocks);

  it("returns all products", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const products = [
      { id: 1, product_name: "Pen", price: 10, stock_quantity: 50, category_id: 1 },
      { id: 2, product_name: "Pencil", price: 5, stock_quantity: 100, category_id: 1 },
    ];
    mockSupabase.from.mockImplementation(() => mockBuilder(products));

    await getProducts(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("products");
    expect(res.json).toHaveBeenCalledWith(products);
  });

  it("returns empty array when no products exist", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() => mockBuilder([]));

    await getProducts(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns 500 on Supabase error", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "DB error" })
    );

    await getProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
  });
});

describe("getProductById", () => {
  beforeEach(resetMocks);

  it("returns a product by id", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const product = { id: 1, product_name: "Pen", price: 10, stock_quantity: 50, category_id: 1 };
    mockSupabase.from.mockImplementation(() => mockBuilder(product));

    await getProductById(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("products");
    expect(res.json).toHaveBeenCalledWith(product);
  });

  it("returns 404 when product not found", async () => {
    const req = { params: { id: "999" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() => mockBuilder(null));

    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Product not found" });
  });

  it("returns 500 on Supabase error", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Fetch error" })
    );

    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Fetch error" });
  });
});

describe("createProduct", () => {
  beforeEach(resetMocks);

  it("creates a product successfully", async () => {
    const req = {
      body: {
        category_id: 1,
        product_name: "New Pen",
        description: "A nice pen",
        price: 15,
        stock_quantity: 100,
        image_url: "https://example.com/pen.jpg",
      },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const newProduct = [{
      id: 1,
      category_id: 1,
      product_name: "New Pen",
      description: "A nice pen",
      price: 15,
      stock_quantity: 100,
      image_url: "https://example.com/pen.jpg",
    }];
    mockSupabase.from.mockImplementation(() => mockBuilder(newProduct));

    await createProduct(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("products");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Product Created Successfully",
      product: newProduct,
    });
  });

  it("returns 500 on Supabase error", async () => {
    const req = {
      body: { category_id: 1, product_name: "New Pen", price: 15 },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Insert failed" })
    );

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Insert failed" });
  });
});

describe("updateProduct", () => {
  beforeEach(resetMocks);

  it("updates a product successfully", async () => {
    const req = {
      params: { id: "1" },
      body: { product_name: "Updated Pen", price: 20, stock_quantity: 80 },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const updated = [{
      id: 1,
      product_name: "Updated Pen",
      price: 20,
      stock_quantity: 80,
      category_id: 1,
    }];
    mockSupabase.from.mockImplementation(() => mockBuilder(updated));

    await updateProduct(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("products");
    expect(res.json).toHaveBeenCalledWith({
      message: "Product Updated Successfully",
      product: updated,
    });
  });

  it("returns 500 on Supabase error", async () => {
    const req = {
      params: { id: "1" },
      body: { product_name: "Updated Pen", price: 20 },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Update failed" })
    );

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Update failed" });
  });
});

describe("deleteProduct", () => {
  beforeEach(resetMocks);

  it("deletes a product successfully", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() => mockBuilder([]));

    await deleteProduct(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("products");
    expect(res.json).toHaveBeenCalledWith({ message: "Product Deleted Successfully" });
  });

  it("returns 500 on Supabase error", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Delete failed" })
    );

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Delete failed" });
  });
});
