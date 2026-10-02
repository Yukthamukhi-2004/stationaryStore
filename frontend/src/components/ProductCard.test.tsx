import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApp } from "../context/useApp";
import type { ProductItem } from "../data/products";
import ProductCard from "./ProductCard";

vi.mock("../context/useApp", () => ({ useApp: vi.fn() }));

vi.mock("./CartSparkles", () => ({
  default: () => null,
  useSparkles: () => ({ trigger: 0, fire: vi.fn() }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    button: ({
      children,
      onClick,
      "aria-label": ariaLabel,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      "aria-label"?: string;
    }) => (
      <button aria-label={ariaLabel} onClick={onClick}>
        {children}
      </button>
    ),
    span: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
  },
}));

const product: ProductItem = {
  id: 123,
  name: "Notebook",
  price: 120,
  image: "",
  category: "notebooks",
};

const updateQuantity = vi.fn();

describe("ProductCard cart identity", () => {
  beforeEach(() => {
    updateQuantity.mockReset();
    vi.mocked(useApp).mockReturnValue({
      cart: [
        {
          id: "backend-123",
          productId: 123,
          name: "Notebook",
          price: 120,
          quantity: 2,
          image: "",
          category: "",
        },
      ],
      cartError: null,
      addToCart: vi.fn(),
      removeFromCart: vi.fn(),
      updateQuantity,
      clearCart: vi.fn(),
      retryCartAction: vi.fn(),
      cartTotal: 240,
      cartCount: 2,
      favorites: new Set(),
      toggleFavorite: vi.fn(),
      isFavorite: () => false,
      isCartOnline: true,
    });
  });

  it("displays and updates a backend cart item by productId", () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: "View details for Notebook" }),
    ).toHaveAttribute("href", "/shopping/products/123");
    expect(screen.getByText("2")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Increase Notebook quantity" }),
    );

    expect(updateQuantity).toHaveBeenCalledWith(123, 1);
  });

  it("labels the empty-cart action Add to Cart", () => {
    const addToCart = vi.fn();
    vi.mocked(useApp).mockReturnValue({
      cart: [],
      cartError: null,
      addToCart,
      removeFromCart: vi.fn(),
      updateQuantity,
      clearCart: vi.fn(),
      retryCartAction: vi.fn(),
      cartTotal: 0,
      cartCount: 0,
      favorites: new Set(),
      toggleFavorite: vi.fn(),
      isFavorite: () => false,
      isCartOnline: true,
    });

    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(addToCart).toHaveBeenCalledWith(
      expect.objectContaining({ productId: product.id }),
    );
  });
});
