import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLowStock from "./AdminLowStock";

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    getLowStockProducts: vi.fn(),
    restockProduct: vi.fn(),
  },
}));

vi.mock("../../lib/api", () => ({ api: mockApi }));
vi.mock("../../components/PageTransition", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("framer-motion", () => ({
  motion: {
    button: ({
      children,
      disabled,
      onClick,
      "aria-label": ariaLabel,
    }: {
      children: ReactNode;
      disabled?: boolean;
      onClick?: () => void;
      "aria-label"?: string;
    }) => (
      <button aria-label={ariaLabel} disabled={disabled} onClick={onClick}>
        {children}
      </button>
    ),
    tr: ({ children }: { children: ReactNode }) => <tr>{children}</tr>,
  },
}));

const lowStockData = {
  threshold: 10,
  count: 1,
  products: [
    {
      id: 9,
      product_name: "Graphite Pencil",
      stock_quantity: 2,
      price: 5,
      category_id: 1,
      image_url: null,
    },
  ],
};

describe("AdminLowStock restock quantity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getLowStockProducts.mockResolvedValue(lowStockData);
    mockApi.restockProduct.mockResolvedValue({
      message: "Restocked",
      product: {},
    });
  });

  it("requires a positive integer and sends the entered quantity", async () => {
    render(<AdminLowStock />);

    const quantityInput = await screen.findByRole("spinbutton", {
      name: "Quantity to add for Graphite Pencil",
    });
    const restockButton = screen.getByRole("button", {
      name: "Restock Graphite Pencil",
    });

    expect(restockButton).toBeDisabled();
    fireEvent.change(quantityInput, { target: { value: "1.5" } });
    expect(restockButton).toBeDisabled();
    fireEvent.change(quantityInput, { target: { value: "0" } });
    expect(restockButton).toBeDisabled();
    fireEvent.change(quantityInput, { target: { value: "7" } });
    expect(restockButton).toBeEnabled();

    fireEvent.click(restockButton);

    expect(mockApi.restockProduct).toHaveBeenCalledWith(9, 7);
  });
});
