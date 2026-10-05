import type { ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { UserContext } from "../context/UserContext";
import AdminLayout from "./AdminLayout";

vi.mock("./BrandLogo", () => ({
  default: () => <span aria-hidden="true">Logo</span>,
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    aside: ({ children }: { children: ReactNode }) => <aside>{children}</aside>,
    div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  },
}));

describe("AdminLayout inventory navigation group", () => {
  const mockSignOut = vi.fn();

  const renderAdminLayout = (path = "/admin/low-stock") =>
    render(
      <UserContext.Provider
        value={{
          user: {
            id: "verified-admin",
            name: "Verified Admin",
            email: "admin@example.com",
          },
          isLoaded: true,
          signIn: vi.fn().mockResolvedValue(undefined),
          signUp: vi.fn().mockResolvedValue(undefined),
          signOut: mockSignOut,
          updateName: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={[path]}>
          <AdminLayout />
        </MemoryRouter>
      </UserContext.Provider>,
    );

  it("groups the existing inventory routes in desktop and mobile menus", () => {
    renderAdminLayout();

    const desktopGroup = within(screen.getByRole("navigation")).getByRole(
      "group",
      { name: "Stock management" },
    );
    for (const route of [
      ["Inventory", "/admin/inventory"],
      ["Low Stock", "/admin/low-stock"],
      ["Reorder", "/admin/reorder"],
    ]) {
      const link = within(desktopGroup).getByRole("link", {
        name: new RegExp(route[0]),
      });
      expect(link).toHaveAttribute("href", route[1]);
    }
    expect(
      within(desktopGroup).getByRole("link", { name: /Low Stock/ }),
    ).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const mobileGroups = screen.getAllByRole("group", {
      name: "Stock management",
    });
    const mobileGroup = mobileGroups[mobileGroups.length - 1];
    for (const route of [
      ["Inventory", "/admin/inventory"],
      ["Low Stock", "/admin/low-stock"],
      ["Reorder", "/admin/reorder"],
    ]) {
      expect(
        within(mobileGroup).getByRole("link", { name: new RegExp(route[0]) }),
      ).toHaveAttribute("href", route[1]);
    }
  });

  it("shows the verified admin identity, logout, and store link", () => {
    mockSignOut.mockReset();
    renderAdminLayout("/admin/dashboard");

    expect(screen.getByText("Verified Admin")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Store/ })).toHaveAttribute(
      "href",
      "/shopping/home",
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(mockSignOut).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getAllByText("Verified Admin")).toHaveLength(2);
    expect(screen.getAllByText("admin@example.com")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /View Store/ })).toHaveLength(2);
  });
});
