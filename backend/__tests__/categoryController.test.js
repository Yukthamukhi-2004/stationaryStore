const { getCategories, getCategoryById } = require("../controllers/categoryController");

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

describe("getCategories", () => {
  beforeEach(resetMocks);

  it("returns all categories", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const categories = [
      { id: 1, name: "Notebooks", description: "Notebooks and diaries" },
      { id: 2, name: "Books", description: "Books and novels" },
    ];
    mockSupabase.from.mockImplementation(() => mockBuilder(categories));

    await getCategories(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("categories");
    expect(res.json).toHaveBeenCalledWith(categories);
  });

  it("returns empty array when no categories exist", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() => mockBuilder([]));

    await getCategories(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns 500 on Supabase error", async () => {
    const req = {};
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "DB error" })
    );

    await getCategories(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
  });
});

describe("getCategoryById", () => {
  beforeEach(resetMocks);

  it("returns a category by id", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const category = { id: 1, name: "Notebooks", description: "Notebooks and diaries" };
    mockSupabase.from.mockImplementation(() => mockBuilder(category));

    await getCategoryById(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("categories");
    expect(res.json).toHaveBeenCalledWith(category);
  });

  it("returns 404 when category not found", async () => {
    const req = { params: { id: "999" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    // .single() returns null when not found
    mockSupabase.from.mockImplementation(() => mockBuilder(null));

    await getCategoryById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Category not found" });
  });

  it("returns 500 on Supabase error", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Fetch error" })
    );

    await getCategoryById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Fetch error" });
  });
});
