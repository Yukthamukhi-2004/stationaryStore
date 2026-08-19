const { getProfile, updateProfile } = require("../controllers/profileController");

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

describe("getProfile", () => {
  beforeEach(resetMocks);

  it("returns a profile by user_id (mapped with derived name)", async () => {
    const req = { params: { user_id: "clerk-123" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const profile = {
      id: 1,
      user_id: "clerk-123",
      email: "john@example.com",
      first_name: "John",
      last_name: "Doe",
      role: "user",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };
    mockSupabase.from.mockImplementation(() => mockBuilder(profile));

    await getProfile(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
    expect(res.json).toHaveBeenCalledWith({
      id: 1,
      user_id: "clerk-123",
      email: "john@example.com",
      name: "John Doe",
      role: "user",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    });
  });

  it("returns 400 when user_id is missing", async () => {
    const req = { params: {} };
    const res = mockRes();

    await getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "user_id is required" });
  });

  it("returns 404 when profile not found (PGRST116 error)", async () => {
    const req = { params: { user_id: "nonexistent" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    // Supabase returns PGRST116 when no rows match .single()
    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { code: "PGRST116", message: "No rows found" })
    );

    await getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Profile not found" });
  });

  it("returns 500 on other Supabase errors", async () => {
    const req = { params: { user_id: "clerk-123" } };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { code: "OTHER", message: "DB error" })
    );

    await getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
  });
});

describe("updateProfile", () => {
  beforeEach(resetMocks);

  it("updates a profile successfully with allowed fields", async () => {
    const req = {
      params: { user_id: "clerk-123" },
      body: { role: "admin", name: "Jane Doe" },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const updated = [{
      id: 1,
      user_id: "clerk-123",
      email: null,
      first_name: "Jane",
      last_name: "Doe",
      role: "admin",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    }];
    mockSupabase.from.mockImplementation(() => mockBuilder(updated));

    await updateProfile(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
    expect(res.json).toHaveBeenCalledWith({
      message: "Profile updated successfully",
      profile: {
        id: 1,
        user_id: "clerk-123",
        email: null,
        name: "Jane Doe",
        role: "admin",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    });
  });

  it("returns 400 when user_id is missing", async () => {
    const req = { params: {}, body: { role: "admin" } };
    const res = mockRes();

    await updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "user_id is required" });
  });

  it("returns 400 when no valid fields provided", async () => {
    const req = {
      params: { user_id: "clerk-123" },
      body: { age: 26, profession: "Developer", address: "123 Main St" },
    };
    const res = mockRes();

    await updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "No valid fields to update" });
  });

  it("strips out non-allowed fields from update payload", async () => {
    const req = {
      params: { user_id: "clerk-123" },
      body: { age: 30, profession: "Engineer", name: "Jane Doe" },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    const updated = [{ id: 1, user_id: "clerk-123", first_name: "Jane", last_name: "Doe", role: "user" }];
    mockSupabase.from.mockImplementation(() => mockBuilder(updated));

    await updateProfile(req, res);

    // Only `name` is an allowed field; age/profession are stripped
    expect(res.json).toHaveBeenCalledWith({
      message: "Profile updated successfully",
      profile: {
        id: 1,
        user_id: "clerk-123",
        email: null,
        name: "Jane Doe",
        role: "user",
        created_at: null,
        updated_at: null,
      },
    });
  });

  it("returns 404 when profile not found (empty data)", async () => {
    const req = {
      params: { user_id: "nonexistent" },
      body: { name: "Jane" },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() => mockBuilder([]));

    await updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Profile not found" });
  });

  it("returns 500 on Supabase error", async () => {
    const req = {
      params: { user_id: "clerk-123" },
      body: { role: "admin" },
    };
    const res = mockRes();
    const mockBuilder = createQueryBuilderFactory();

    mockSupabase.from.mockImplementation(() =>
      mockBuilder(null, { message: "Update failed" })
    );

    await updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Update failed" });
  });
});
