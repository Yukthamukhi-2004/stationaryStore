import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminReorder from "./AdminReorder";
import type { BulkRestockResponse } from "../../lib/api";

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    getReorderSuggestions: vi.fn(),
    bulkRestock: vi.fn(),
  },
}));

vi.mock("../../lib/api", () => ({ api: mockApi }));
vi.mock("../../components/PageTransition", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("framer-motion", () => ({
  motion: {
    tr: ({ children }: { children: ReactNode }) => <tr>{children}</tr>,
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

const suggestions = {
  threshold: 20,
  count: 2,
  total_estimated_cost: 75,
  suggestions: [
    {
      id: 1,
      product_name: "Notebook",
      current_stock: 2,
      suggested_reorder_qty: 10,
      estimated_cost: 50,
      price: 5,
      category_id: 1,
    },
    {
      id: 2,
      product_name: "Marker",
      current_stock: 1,
      suggested_reorder_qty: 5,
      estimated_cost: 25,
      price: 5,
      category_id: 1,
    },
  ],
};

describe("AdminReorder bulk restock results", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getReorderSuggestions.mockResolvedValue(suggestions);
  });

  it("reports response counts and identifies failed products", async () => {
    mockApi.bulkRestock.mockResolvedValue({
      message: "Bulk restock completed. 1 succeeded, 1 failed.",
      results: [{ product_id: 1, new_stock: 12, message: "Restocked by 10" }],
      errors: [{ product_id: 2, error: "Product not found" }],
    });

    render(<AdminReorder />);
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Review 2 Selected Products",
      }),
    );
    const confirmation = await screen.findByRole("dialog", {
      name: "Confirm bulk restock",
    });
    expect(confirmation).toHaveTextContent("Notebook");
    expect(confirmation).toHaveTextContent("10 units");
    expect(confirmation).toHaveTextContent("Marker");
    expect(confirmation).toHaveTextContent("5 units");
    fireEvent.click(screen.getByRole("button", { name: "Confirm restock" }));

    const summary = await screen.findByRole("alert");
    expect(summary).toHaveTextContent("1 succeeded, 1 failed");
    expect(summary).toHaveTextContent("Notebook (#1)");
    expect(summary).toHaveTextContent("10 units · New stock: 12");
    expect(summary).toHaveTextContent("Marker (#2)");
    expect(summary).toHaveTextContent("5 units · Product not found");
    expect(mockApi.bulkRestock).toHaveBeenCalledWith([
      { product_id: 1, quantity: 10 },
      { product_id: 2, quantity: 5 },
    ]);
  });

  it("shows progress while the confirmed bulk request is pending", async () => {
    let resolveBulkRestock!: (response: BulkRestockResponse) => void;
    mockApi.bulkRestock.mockReturnValue(
      new Promise((resolve) => {
        resolveBulkRestock = resolve;
      }),
    );

    render(<AdminReorder />);
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Review 2 Selected Products",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm restock" }));

    expect(
      await screen.findByRole("progressbar", {
        name: "Bulk restock progress",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Restocking 2 products",
    );

    resolveBulkRestock({
      message: "Bulk restock completed. 2 succeeded, 0 failed.",
      results: [
        { product_id: 1, new_stock: 12, message: "Restocked by 10" },
        { product_id: 2, new_stock: 6, message: "Restocked by 5" },
      ],
    });
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Bulk restock complete: 2 succeeded, 0 failed",
      );
    });
  });
});
