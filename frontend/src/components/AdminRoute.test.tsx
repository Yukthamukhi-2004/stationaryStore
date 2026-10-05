import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import AdminRoute from "./AdminRoute";
import { api } from "../lib/api";
import supabase from "../lib/supabase";

vi.mock("./AdminLayout", () => ({
  default: () => <div>Admin panel content</div>,
}));
vi.mock("../lib/api", () => ({
  api: { verifyAdmin: vi.fn() },
}));
vi.mock("../lib/supabase", () => ({
  default: { auth: { getSession: vi.fn() } },
}));

const mockVerifyAdmin = vi.mocked(api.verifyAdmin);
const mockGetSession = vi.mocked(supabase.auth.getSession);

function renderAdminRoute(
  user: { id: string; name: string; email: string } | null,
) {
  return render(
    <UserContext.Provider
      value={{
        user,
        isLoaded: true,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateName: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/admin/*" element={<AdminRoute />} />
          <Route path="/shopping/auth" element={<div>Sign in page</div>} />
        </Routes>
      </MemoryRouter>
    </UserContext.Provider>,
  );
}

describe("AdminRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "session-token" } },
    } as Awaited<ReturnType<typeof supabase.auth.getSession>>);
  });

  it("redirects signed-out visitors to sign in", () => {
    renderAdminRoute(null);

    expect(screen.getByText("Sign in page")).toBeInTheDocument();
    expect(mockVerifyAdmin).not.toHaveBeenCalled();
  });

  it("shows access denied for a non-admin session", async () => {
    mockVerifyAdmin.mockRejectedValue(
      Object.assign(new Error("Forbidden"), { status: 403 }),
    );
    renderAdminRoute({ id: "user-1", name: "User", email: "user@example.com" });

    expect(
      await screen.findByRole("heading", { name: "Admin access required" }),
    ).toBeInTheDocument();
  });

  it("shows access denied when verification returns unauthorized", async () => {
    mockVerifyAdmin.mockResolvedValue({ authorized: false });
    renderAdminRoute({ id: "user-1", name: "User", email: "user@example.com" });

    expect(
      await screen.findByRole("heading", { name: "Admin access required" }),
    ).toBeInTheDocument();
  });

  it("renders the admin panel after server verification", async () => {
    mockVerifyAdmin.mockResolvedValue({ authorized: true });
    renderAdminRoute({
      id: "admin-1",
      name: "Admin",
      email: "admin@example.com",
    });

    expect(await screen.findByText("Admin panel content")).toBeInTheDocument();
    expect(mockVerifyAdmin).toHaveBeenCalledWith("session-token");
  });
});
