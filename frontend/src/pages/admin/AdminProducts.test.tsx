import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminProducts from "./AdminProducts";
import type { Product } from "../../lib/api";

const { mockApi, mockUploadProductImage } = vi.hoisted(() => ({
  mockApi: {
    getProducts: vi.fn(),
    getCategories: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
  mockUploadProductImage: vi.fn(),
}));

vi.mock("../../lib/api", () => ({ api: mockApi }));
vi.mock("../../lib/storage", () => ({
  uploadProductImage: mockUploadProductImage,
}));
vi.mock("../../components/PageTransition", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
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
    div: ({
      children,
      onClick,
    }: {
      children: ReactNode;
      onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    }) => <div onClick={onClick}>{children}</div>,
    tr: ({ children }: { children: ReactNode }) => <tr>{children}</tr>,
  },
}));

describe("AdminProducts category selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getProducts.mockResolvedValue([]);
    mockApi.getCategories.mockResolvedValue([
      { id: 7, name: "Notebooks", created_at: "" },
    ]);
    mockApi.createProduct.mockResolvedValue({
      message: "Created",
      product: [],
    });
    mockUploadProductImage.mockReset().mockResolvedValue("uploaded-image.jpg");
  });

  it("shows category names and submits a trimmed product name", async () => {
    render(<AdminProducts />);

    fireEvent.click(
      await screen.findByRole("button", { name: "+ Add Product" }),
    );

    const categorySelect = await screen.findByRole("combobox", {
      name: "Category *",
    });
    expect(categorySelect).toHaveDisplayValue("Select a category");
    expect(categorySelect.querySelector('option[value="7"]')).toHaveTextContent(
      "Notebooks",
    );

    fireEvent.change(categorySelect, { target: { value: "7" } });
    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "  Ruled Notebook  " },
    });
    fireEvent.change(screen.getAllByRole("spinbutton")[0], {
      target: { value: "25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await screen.findByRole("button", { name: "+ Add Product" });
    expect(mockApi.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        product_name: "Ruled Notebook",
        stock_quantity: 0,
        category_id: 7,
      }),
    );
  });

  it("shows field errors and rejects invalid product input", async () => {
    render(<AdminProducts />);
    fireEvent.click(
      await screen.findByRole("button", { name: "+ Add Product" }),
    );

    fireEvent.change(screen.getByLabelText("Product Name *"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Price (₹) *"), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText("Stock Quantity"), {
      target: { value: "1.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("Enter a product name."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Enter a price greater than zero with up to two decimal places.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter a whole number of 0 or greater."),
    ).toBeInTheDocument();
    expect(screen.getByText("Choose a category.")).toBeInTheDocument();
    expect(mockApi.createProduct).not.toHaveBeenCalled();
  });

  it("preserves entered values after save failure and blocks duplicate submits", async () => {
    let rejectCreate!: (error: Error) => void;
    mockApi.createProduct.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectCreate = reject;
      }),
    );

    render(<AdminProducts />);
    fireEvent.click(
      await screen.findByRole("button", { name: "+ Add Product" }),
    );
    fireEvent.change(screen.getByLabelText("Product Name *"), {
      target: { value: "Saved Draft" },
    });
    fireEvent.change(screen.getByLabelText("Price (₹) *"), {
      target: { value: "12.50" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Category *" }), {
      target: { value: "7" },
    });

    const form = screen.getByRole("form", { name: "Add product form" });
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(mockApi.createProduct).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();

    rejectCreate(new Error("Network unavailable"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Network unavailable",
    );
    expect(screen.getByLabelText("Product Name *")).toHaveValue("Saved Draft");
    expect(screen.getByLabelText("Price (₹) *")).toHaveValue(12.5);
    expect(screen.getByRole("combobox", { name: "Category *" })).toHaveValue(
      "7",
    );
  });

  it("shows upload progress and previews the uploaded image", async () => {
    let resolveUpload!: (url: string) => void;
    mockUploadProductImage.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveUpload = resolve;
      }),
    );

    render(<AdminProducts />);
    fireEvent.click(
      await screen.findByRole("button", { name: "+ Add Product" }),
    );
    const imageInput = screen.getByLabelText("Product Image");
    const file = new File(["image bytes"], "product.png", {
      type: "image/png",
    });
    fireEvent.change(imageInput, { target: { files: [file] } });

    expect(
      await screen.findByRole("progressbar", {
        name: "Uploading product image",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Uploading image..." }),
    ).toBeDisabled();

    resolveUpload("https://example.test/product.png");

    expect(
      await screen.findByRole("img", { name: "Product image preview" }),
    ).toHaveAttribute("src", "https://example.test/product.png");
    expect(screen.getByText("Image ready to save")).toBeInTheDocument();
  });

  it("searches, filters, sorts, and paginates loaded products", async () => {
    const products: Product[] = Array.from({ length: 12 }, (_, index) => {
      const id = index + 1;
      return {
        id,
        category_id: id % 2 === 0 ? 8 : 7,
        product_name: `Product ${String(id).padStart(2, "0")}`,
        description: null,
        price: id * 10,
        stock_quantity: id === 2 ? 0 : 5,
        image_url: null,
        created_at: "",
      };
    });
    mockApi.getProducts.mockResolvedValue(products);
    mockApi.getCategories.mockResolvedValue([
      { id: 7, name: "Notebooks", created_at: "" },
      { id: 8, name: "Pens", created_at: "" },
    ]);

    render(<AdminProducts />);
    expect(
      await screen.findByText("Manage your product catalog (12 loaded)"),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText("Category", {
        selector: "select#product-category-filter",
      }),
      { target: { value: "8" } },
    );
    fireEvent.change(screen.getByLabelText("Sort by"), {
      target: { value: "price-desc" },
    });
    expect(screen.getAllByText(/^Product/)[0]).toHaveTextContent("Product 12");

    fireEvent.change(screen.getByLabelText("Search products"), {
      target: { value: "Product 12" },
    });
    expect(screen.getByText("Product 12")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing 1–1 of 1 matching; 12 loaded",
    );
  });

  it("paginates loaded products without changing the loaded count", async () => {
    const products: Product[] = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      category_id: 7,
      product_name: `Product ${String(index + 1).padStart(2, "0")}`,
      description: null,
      price: index + 1,
      stock_quantity: 10,
      image_url: null,
      created_at: "",
    }));
    mockApi.getProducts.mockResolvedValue(products);

    render(<AdminProducts />);
    await screen.findByText("Product 01");
    fireEvent.click(screen.getByRole("button", { name: "Next products page" }));

    expect(screen.getByText("Product 11")).toBeInTheDocument();
    expect(screen.getByText("Product 12")).toBeInTheDocument();
    expect(screen.queryByText("Product 10")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing 11–12 of 12 matching; 12 loaded",
    );
  });
});
