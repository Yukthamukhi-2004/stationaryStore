import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "./AppContext";
import { useApp } from "./useApp";

const { mockUseUser, mockApi } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockApi: {
    getCartByUserId: vi.fn(),
    createCart: vi.fn(),
    getCartItemsByCartId: vi.fn(),
    updateCartItem: vi.fn(),
    createCartItem: vi.fn(),
    deleteCartItem: vi.fn(),
  },
}));

vi.mock("./useUser", () => ({ useUser: mockUseUser }));
vi.mock("../lib/api", () => ({ api: mockApi }));

const guestCart = [
  {
    id: "123",
    productId: 123,
    name: "Notebook",
    price: 120,
    quantity: 2,
    image: "",
    category: "notebooks",
  },
];

function CartSummary() {
  const {
    cart,
    addToCart,
    updateQuantity,
    cartError,
    retryCartAction,
    pendingProductIds,
    isCartOnline,
    favorites,
    toggleFavorite,
  } = useApp();
  return (
    <>
      <div data-testid="cart-items">
        {cart.map((item) => `${item.productId}:${item.quantity}`).join(",") ||
          "empty"}
      </div>
      <div data-testid="favorites">
        {Array.from(favorites).join(",") || "empty"}
      </div>
      <div data-testid="pending-product">
        {pendingProductIds.has(123) ? "pending" : "idle"}
      </div>
      <div>{isCartOnline ? "online" : "offline"}</div>
      {cartError && <div role="alert">{cartError}</div>}
      <button
        disabled={pendingProductIds.has(123)}
        onClick={() => void addToCart(guestCart[0])}
      >
        Add guest item
      </button>
      <button
        disabled={pendingProductIds.has(123)}
        onClick={() => void updateQuantity(123, 1)}
      >
        Increase guest item
      </button>
      <button onClick={retryCartAction}>Retry cart action</button>
      <button onClick={() => toggleFavorite(42)}>Toggle favorite</button>
    </>
  );
}

function renderCart() {
  return render(
    (
      <AppProvider>
        <CartSummary />
      </AppProvider>
    ) as ReactNode,
  );
}

describe("AppProvider guest cart persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseUser.mockReturnValue({ user: null, isLoaded: true });
    Object.values(mockApi).forEach((apiCall) => apiCall.mockReset());
  });

  it("restores and keeps guest cart through a provider remount", () => {
    localStorage.setItem("sarada_cart", JSON.stringify(guestCart));
    localStorage.setItem("sarada_cart_owner", "__guest__");

    const firstRender = renderCart();
    expect(screen.getByText("123:2")).toBeInTheDocument();
    firstRender.unmount();

    renderCart();

    expect(screen.getByText("123:2")).toBeInTheDocument();
    expect(localStorage.getItem("sarada_cart")).toBe(JSON.stringify(guestCart));
  });

  it("restores favorites separately for each account on this device", async () => {
    localStorage.setItem(
      "sarada_favorites:user:user-a",
      JSON.stringify([11, 12]),
    );
    localStorage.setItem("sarada_favorites:user:user-b", JSON.stringify([21]));
    mockApi.getCartByUserId.mockResolvedValue({ id: 7 });
    mockApi.getCartItemsByCartId.mockResolvedValue([]);
    mockUseUser.mockReturnValue({
      user: { id: "user-a", email: "a@example.com" },
      isLoaded: true,
    });

    const view = renderCart();
    expect(await screen.findByTestId("favorites")).toHaveTextContent("11,12");

    mockUseUser.mockReturnValue({
      user: { id: "user-b", email: "b@example.com" },
      isLoaded: true,
    });
    view.rerender(
      (
        <AppProvider>
          <CartSummary />
        </AppProvider>
      ) as ReactNode,
    );

    await waitFor(() => {
      expect(screen.getByTestId("favorites")).toHaveTextContent("21");
    });
    expect(screen.getByTestId("favorites")).not.toHaveTextContent("11");

    fireEvent.click(screen.getByRole("button", { name: "Toggle favorite" }));
    await waitFor(() => {
      expect(localStorage.getItem("sarada_favorites:user:user-b")).toBe(
        JSON.stringify([21, 42]),
      );
    });

    mockUseUser.mockReturnValue({
      user: { id: "user-a", email: "a@example.com" },
      isLoaded: true,
    });
    view.rerender(
      (
        <AppProvider>
          <CartSummary />
        </AppProvider>
      ) as ReactNode,
    );

    await waitFor(() => {
      expect(screen.getByTestId("favorites")).toHaveTextContent("11,12");
    });
    expect(localStorage.getItem("sarada_favorites:user:user-a")).toBe(
      JSON.stringify([11, 12]),
    );
  });

  it("merges guest selections present when login starts", async () => {
    let resolveCartLookup!: (cart: { id: number }) => void;
    const pendingCartLookup = new Promise<{ id: number }>((resolve) => {
      resolveCartLookup = resolve;
    });
    const backendItems: Array<{
      id: number;
      cart_id: number;
      product_id: number;
      quantity: number;
      created_at: string;
      products: {
        product_name: string;
        price: number;
        image_url: string;
      };
    }> = [];

    mockApi.getCartByUserId.mockReturnValue(pendingCartLookup);
    mockApi.getCartItemsByCartId.mockImplementation(async () => backendItems);
    mockApi.createCartItem.mockImplementation(
      async (cartId: number, productId: number, quantity: number) => {
        backendItems.push({
          id: 77,
          cart_id: cartId,
          product_id: productId,
          quantity,
          created_at: "",
          products: {
            product_name: "Notebook",
            price: 120,
            image_url: "",
          },
        });
        return { item: [{ id: 77 }] };
      },
    );

    const view = renderCart();
    fireEvent.click(screen.getByRole("button", { name: "Add guest item" }));

    mockUseUser.mockReturnValue({
      user: { id: "user-1", email: "guest@example.com" },
      isLoaded: true,
    });
    view.rerender(
      (
        <AppProvider>
          <CartSummary />
        </AppProvider>
      ) as ReactNode,
    );

    await waitFor(() => expect(mockApi.getCartByUserId).toHaveBeenCalled());
    resolveCartLookup({ id: 7 });

    await waitFor(() => {
      expect(mockApi.createCartItem).toHaveBeenCalledWith(7, 123, 2);
    });
    expect(await screen.findByText("123:2")).toBeInTheDocument();
  });

  it("prevents a second add while the first backend write is pending", async () => {
    let resolveCreate!: (response: { item: Array<{ id: number }> }) => void;
    const pendingCreate = new Promise<{ item: Array<{ id: number }> }>(
      (resolve) => {
        resolveCreate = resolve;
      },
    );
    mockUseUser.mockReturnValue({
      user: { id: "user-1", email: "a@example.com" },
      isLoaded: true,
    });
    mockApi.getCartByUserId.mockResolvedValue({ id: 7 });
    mockApi.getCartItemsByCartId.mockResolvedValue([]);
    mockApi.createCartItem.mockReturnValue(pendingCreate);

    renderCart();
    await screen.findByText("online");
    fireEvent.click(screen.getByRole("button", { name: "Add guest item" }));

    await waitFor(() => {
      expect(screen.getByTestId("pending-product")).toHaveTextContent(
        "pending",
      );
    });
    const addButton = screen.getByRole("button", { name: "Add guest item" });
    expect(addButton).toBeDisabled();
    fireEvent.click(addButton);
    expect(mockApi.createCartItem).toHaveBeenCalledTimes(1);

    resolveCreate({ item: [{ id: 88 }] });
    await waitFor(() => {
      expect(screen.getByTestId("pending-product")).toHaveTextContent("idle");
    });
  });

  it("shows server stock validation feedback after rejecting an add", async () => {
    const stockError = Object.assign(new Error("Only 0 more available"), {
      status: 400,
    });
    mockUseUser.mockReturnValue({
      user: { id: "user-1", email: "a@example.com" },
      isLoaded: true,
    });
    mockApi.getCartByUserId.mockResolvedValue({ id: 7 });
    mockApi.getCartItemsByCartId.mockResolvedValue([]);
    mockApi.createCartItem.mockRejectedValue(stockError);

    renderCart();
    await screen.findByText("online");
    fireEvent.click(screen.getByRole("button", { name: "Add guest item" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Only 0 more available",
    );
    expect(screen.getByTestId("cart-items")).toHaveTextContent("empty");
  });

  it("prevents overlapping quantity updates for the same product", async () => {
    let resolveUpdate!: () => void;
    const pendingUpdate = new Promise<void>((resolve) => {
      resolveUpdate = resolve;
    });
    mockUseUser.mockReturnValue({
      user: { id: "user-1", email: "a@example.com" },
      isLoaded: true,
    });
    mockApi.getCartByUserId.mockResolvedValue({ id: 7 });
    mockApi.getCartItemsByCartId.mockResolvedValue([
      {
        id: 77,
        cart_id: 7,
        product_id: 123,
        quantity: 2,
        created_at: "",
        products: {
          product_name: "Notebook",
          price: 120,
          image_url: "",
        },
      },
    ]);
    mockApi.updateCartItem.mockReturnValue(pendingUpdate);

    renderCart();
    await screen.findByText("online");
    fireEvent.click(
      screen.getByRole("button", { name: "Increase guest item" }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("pending-product")).toHaveTextContent(
        "pending",
      );
    });
    const increaseButton = screen.getByRole("button", {
      name: "Increase guest item",
    });
    expect(increaseButton).toBeDisabled();
    fireEvent.click(increaseButton);
    expect(mockApi.updateCartItem).toHaveBeenCalledTimes(1);

    resolveUpdate();
    await waitFor(() => {
      expect(screen.getByTestId("pending-product")).toHaveTextContent("idle");
    });
  });

  it("does not merge a signed-out account cart into the next account", async () => {
    const accountCart = [
      {
        id: 77,
        cart_id: 7,
        product_id: 123,
        quantity: 2,
        created_at: "",
        products: {
          product_name: "Notebook",
          price: 120,
          image_url: "",
        },
      },
    ];
    mockApi.getCartByUserId
      .mockResolvedValueOnce({ id: 7 })
      .mockResolvedValueOnce({ id: 8 });
    mockApi.getCartItemsByCartId
      .mockResolvedValueOnce(accountCart)
      .mockResolvedValueOnce(accountCart)
      .mockResolvedValue([]);
    mockUseUser.mockReturnValue({
      user: { id: "user-a", email: "a@example.com" },
      isLoaded: true,
    });

    const view = renderCart();
    expect(await screen.findByText("123:2")).toBeInTheDocument();

    mockUseUser.mockReturnValue({ user: null, isLoaded: true });
    view.rerender(
      (
        <AppProvider>
          <CartSummary />
        </AppProvider>
      ) as ReactNode,
    );
    await waitFor(() => {
      expect(screen.getByTestId("cart-items")).toHaveTextContent("empty");
    });

    mockUseUser.mockReturnValue({
      user: { id: "user-b", email: "b@example.com" },
      isLoaded: true,
    });
    view.rerender(
      (
        <AppProvider>
          <CartSummary />
        </AppProvider>
      ) as ReactNode,
    );

    await waitFor(() => {
      expect(screen.getByText("online")).toBeInTheDocument();
      expect(screen.getByTestId("cart-items")).toHaveTextContent("empty");
    });
    expect(mockApi.createCartItem).not.toHaveBeenCalled();
  });

  it("rolls back a failed add and retries the backend save", async () => {
    mockUseUser.mockReturnValue({
      user: { id: "user-1", email: "guest@example.com" },
      isLoaded: true,
    });
    mockApi.getCartByUserId.mockResolvedValue({ id: 7 });
    mockApi.getCartItemsByCartId.mockResolvedValue([]);
    mockApi.createCartItem
      .mockRejectedValueOnce(new Error("save failed"))
      .mockResolvedValueOnce({ item: [{ id: 77 }] });

    renderCart();
    await screen.findByText("online");
    fireEvent.click(screen.getByRole("button", { name: "Add guest item" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cart could not be saved",
    );
    expect(screen.getByTestId("cart-items")).toHaveTextContent("empty");

    fireEvent.click(screen.getByRole("button", { name: "Retry cart action" }));

    await waitFor(() => {
      expect(mockApi.createCartItem).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("cart-items")).toHaveTextContent("123:2");
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("restores the previous quantity when an update fails and retries", async () => {
    mockUseUser.mockReturnValue({
      user: { id: "user-1", email: "guest@example.com" },
      isLoaded: true,
    });
    mockApi.getCartByUserId.mockResolvedValue({ id: 7 });
    mockApi.getCartItemsByCartId.mockResolvedValue([
      {
        id: 77,
        cart_id: 7,
        product_id: 123,
        quantity: 2,
        created_at: "",
        products: {
          product_name: "Notebook",
          price: 120,
          image_url: "",
        },
      },
    ]);
    mockApi.updateCartItem
      .mockRejectedValueOnce(new Error("save failed"))
      .mockResolvedValueOnce(undefined);

    renderCart();
    await screen.findByText("online");
    expect(screen.getByTestId("cart-items")).toHaveTextContent("123:2");

    fireEvent.click(
      screen.getByRole("button", { name: "Increase guest item" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cart could not be saved",
    );
    expect(screen.getByTestId("cart-items")).toHaveTextContent("123:2");

    fireEvent.click(screen.getByRole("button", { name: "Retry cart action" }));

    await waitFor(() => {
      expect(mockApi.updateCartItem).toHaveBeenCalledTimes(2);
      expect(mockApi.updateCartItem).toHaveBeenLastCalledWith(77, 3);
      expect(screen.getByTestId("cart-items")).toHaveTextContent("123:3");
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
