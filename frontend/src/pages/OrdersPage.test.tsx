import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import OrdersPage from "./OrdersPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/shopping/orders", search: "" }),
  };
});

vi.mock("../context/useUser", () => ({
  useUser: () => ({ user: null, isLoaded: true }),
}));

vi.mock("../context/useApp", () => ({
  useApp: () => ({
    cart: [
      {
        id: "1",
        productId: 1,
        name: "Notebook",
        price: 120,
        quantity: 1,
        image: "",
        category: "",
      },
    ],
    cartTotal: 120,
    cartCount: 1,
    updateQuantity: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
    pendingProductIds: new Set(),
  }),
}));

vi.mock("../components/PageTransition", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/UpiQrCode", () => ({
  default: () => <div data-testid="upi-qr" />,
}));

describe("OrdersPage guest checkout flow", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("redirects guest users to auth with a return target when checkout is started", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: /proceed to checkout/i }),
    );

    expect(mockNavigate).toHaveBeenCalledWith("/shopping/auth", {
      state: {
        from: {
          pathname: "/shopping/orders",
          search: "?checkout=1",
        },
      },
    });
  });

  it("shows separate Cart, Checkout, and My Orders destinations", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("tab", { name: /cart/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /checkout/i })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /checkout/i }));
    expect(
      screen.getByRole("heading", { name: "Checkout" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /my orders/i }));
    expect(
      await screen.findByRole("heading", { name: "Order History" }),
    ).toBeInTheDocument();
  });

  it("labels cart quantity controls with the product name", () => {
    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: "Decrease Notebook quantity" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Increase Notebook quantity" }),
    ).toBeInTheDocument();
  });
});
