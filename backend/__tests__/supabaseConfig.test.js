const mockCreateClient = jest.fn(() => ({ name: "mock-client" }));

jest.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

jest.mock("ws", () => ({
  __esModule: true,
  default: { name: "mock-ws" },
}));

describe("Supabase client configuration", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
  });

  it("passes a WebSocket transport for Node 20 compatibility", () => {
    require("../config/supabase");

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-key",
      expect.objectContaining({
        auth: expect.objectContaining({ persistSession: false }),
        realtime: expect.objectContaining({ transport: expect.anything() }),
      }),
    );
  });
});
