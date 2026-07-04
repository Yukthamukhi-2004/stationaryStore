const request = require("supertest");

// Mock Supabase before importing the app
jest.mock("../../config/supabase", () => ({
  from: jest.fn(),
  auth: {},
}));

const app = require("../../server");
const mockSupabase = require("../../config/supabase");

describe("GET / — Health Check", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "ok",
      message: "Stationery Backend Running",
    });
  });

  it("returns JSON content type", async () => {
    const res = await request(app).get("/");

    expect(res.headers["content-type"]).toMatch(/json/);
  });
});
