const request = require("supertest");

jest.mock("../../config/supabase", () => ({
  from: jest.fn(),
  auth: {},
}));

const app = require("../../server");
const mockSupabase = require("../../config/supabase");
const { createQueryBuilderFactory } = require("../helpers/supabaseMock");

describe("Profile API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /profile/:user_id", () => {
    it("returns a profile by user_id (mapped with derived name)", async () => {
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
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(profile));

      const res = await request(app).get("/profile/clerk-123");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 1,
        user_id: "clerk-123",
        email: "john@example.com",
        name: "John Doe",
        role: "user",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      });
    });

    it("returns 404 when profile not found (PGRST116)", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() =>
        builder(null, { code: "PGRST116", message: "No rows found" })
      );

      const res = await request(app).get("/profile/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Profile not found" });
    });
  });

  describe("PUT /profile/:user_id", () => {
    it("updates a profile with allowed fields", async () => {
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
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(updated));

      const res = await request(app)
        .put("/profile/clerk-123")
        .send({ role: "admin", name: "Jane Doe" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
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

    it("returns 400 when no valid fields provided", async () => {
      const res = await request(app)
        .put("/profile/clerk-123")
        .send({ age: 30, profession: "Engineer" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "No valid fields to update" });
    });

    it("returns 404 when profile not found", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder([]));

      const res = await request(app)
        .put("/profile/nonexistent")
        .send({ name: "Jane" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Profile not found" });
    });
  });
});
