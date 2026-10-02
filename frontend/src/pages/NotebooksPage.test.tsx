import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotebooksPage from "./NotebooksPage";
import { getProductsByCategoryNames } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: {},
  getProductsByCategoryNames: vi.fn(),
  mapBackendProduct: (
    product: { id: number; product_name: string },
    category: string,
  ) => ({
    id: product.id,
    name: product.product_name,
    price: 25,
    image: "",
    category,
  }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

vi.mock("../components/PageTransition", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/LoadingScribble", () => ({
  default: () => <div>Loading products</div>,
}));

vi.mock("../components/ProductCard", () => ({
  default: ({ product }: { product: { name: string } }) => (
    <div>{product.name}</div>
  ),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <NotebooksPage />
    </MemoryRouter>,
  );
}

describe("NotebooksPage API states", () => {
  beforeEach(() => {
    vi.mocked(getProductsByCategoryNames).mockReset();
  });

  it("shows an empty state when the API succeeds with no products", async () => {
    vi.mocked(getProductsByCategoryNames).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "No notebooks are available right now.",
    );
    expect(screen.queryByText("Single Ruled Book")).not.toBeInTheDocument();
  });

  it("shows an error and retries instead of rendering sample products", async () => {
    vi.mocked(getProductsByCategoryNames)
      .mockRejectedValueOnce(new Error("request failed"))
      .mockResolvedValueOnce([
        {
          id: 900,
          category_id: 982,
          product_name: "Backend notebook",
          description: null,
          price: 25,
          stock_quantity: 10,
          image_url: null,
          created_at: "",
        },
      ]);

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load notebooks.",
    );
    expect(screen.queryByText("Single Ruled Book")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(getProductsByCategoryNames).toHaveBeenCalledTimes(2);
      expect(getProductsByCategoryNames).toHaveBeenCalledWith(["Notebooks"]);
      expect(screen.getByText("Backend notebook")).toBeInTheDocument();
    });
  });
});
