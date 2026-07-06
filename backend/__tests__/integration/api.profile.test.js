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
    it("returns a profile by user_id", async () => {
      const profile = {
        id: 1,
        clerk_id: "clerk-123",
        role: "user",
        age: 25,
        profession: "Student",
        address: "123 Main St",
      };
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(profile));

      const res = await request(app).get("/profile/clerk-123");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(profile);
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
        clerk_id: "clerk-123",
        role: "admin",
        age: 26,
        profession: "Developer",
        address: "456 Oak St",
      }];
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder(updated));

      const res = await request(app)
        .put("/profile/clerk-123")
        .send({ role: "admin", age: 26, profession: "Developer" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Profile updated successfully",
        profile: updated[0],
      });
    });

    it("returns 400 when no valid fields provided", async () => {
      const res = await request(app)
        .put("/profile/clerk-123")
        .send({ invalid_field: "value" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "No valid fields to update" });
    });

    it("returns 404 when profile not found", async () => {
      const builder = createQueryBuilderFactory();
      mockSupabase.from.mockImplementation(() => builder([]));

      const res = await request(app)
        .put("/profile/nonexistent")
        .send({ age: 30 });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Profile not found" });
    });
  });
});
