import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductDetailPage from "./ProductDetailPage";
import { api, type Product } from "../lib/api";

const { mockAddToCart } = vi.hoisted(() => ({ mockAddToCart: vi.fn() }));

vi.mock("../lib/api", () => ({
  api: { getProduct: vi.fn() },
  mapBackendProduct: (product: Product) => ({
    id: product.id,
    name: product.product_name,
    price: product.price,
    image: product.image_url ?? "fallback.jpg",
    category: "",
  }),
}));

vi.mock("../context/useApp", () => ({
  useApp: () => ({ cart: [], addToCart: mockAddToCart }),
}));

vi.mock("../components/PageTransition", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("framer-motion", () => ({
  motion: {
    button: ({
      children,
      disabled,
      onClick,
    }: {
      children: ReactNode;
      disabled?: boolean;
      onClick?: () => void;
    }) => (
      <button disabled={disabled} onClick={onClick}>
        {children}
      </button>
    ),
  },
}));

const product: Product = {
  id: 42,
  category_id: 2,
  product_name: "Detail Notebook",
  description: "A ruled notebook with durable pages.",
  price: 75,
  stock_quantity: 4,
  image_url: "notebook.jpg",
  created_at: "",
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={["/shopping/products/42"]}>
      <Routes>
        <Route
          path="/shopping/products/:productId"
          element={<ProductDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProductDetailPage", () => {
  beforeEach(() => {
    mockAddToCart.mockReset();
    vi.mocked(api.getProduct).mockReset().mockResolvedValue(product);
  });

  it("shows product details and adds the selected quantity to cart", async () => {
    renderDetail();

    expect(
      await screen.findByRole("heading", { name: "Detail Notebook" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A ruled notebook with durable pages."),
    ).toBeInTheDocument();
    expect(screen.getByText("₹75.00")).toBeInTheDocument();
    expect(screen.getByText("4 in stock")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Detail Notebook" }),
    ).toHaveAttribute("src", "notebook.jpg");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Increase Detail Notebook quantity",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 42, quantity: 2 }),
    );
  });

  it("disables adding when the product is out of stock", async () => {
    vi.mocked(api.getProduct).mockResolvedValue({
      ...product,
      stock_quantity: 0,
    });

    renderDetail();

    expect(await screen.findByText("Out of stock")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeDisabled();
  });
});
