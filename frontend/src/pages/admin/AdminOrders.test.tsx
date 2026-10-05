import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminOrders from "./AdminOrders";
import type { Order, OrderItem, Payment } from "../../lib/api";

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    getOrders: vi.fn(),
    updateOrder: vi.fn(),
    getOrderItems: vi.fn(),
    getPayments: vi.fn(),
  },
}));

vi.mock("../../lib/api", () => ({ api: mockApi }));
vi.mock("../../components/PageTransition", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("framer-motion", () => ({
  motion: {
    tr: ({ children }: { children: ReactNode }) => <tr>{children}</tr>,
  },
}));

const orders: Order[] = Array.from({ length: 12 }, (_, index) => {
  const id = index + 1;
  return {
    id,
    user_id: `user-${id}`,
    total_amount: id * 10,
    status: id % 2 === 0 ? "Pending" : "Shipped",
    created_at: new Date(Date.UTC(2025, 0, id)).toISOString(),
  };
});

describe("AdminOrders loaded list controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getOrders.mockResolvedValue(orders);
    mockApi.getOrderItems.mockResolvedValue([]);
    mockApi.getPayments.mockResolvedValue([]);
  });

  it("searches, filters, sorts, and paginates loaded orders", async () => {
    render(<AdminOrders />);

    expect(
      await screen.findByText("Manage customer orders (12 loaded)"),
    ).toBeInTheDocument();
    expect(screen.getByText("#12")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing 1–10 of 12 matching; 12 loaded",
    );

    fireEvent.click(screen.getByRole("button", { name: "Next orders page" }));
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.queryByText("#12")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search orders"), {
      target: { value: "user-11" },
    });
    expect(screen.getByText("#11")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing 1–1 of 1 matching; 12 loaded",
    );
  });

  it("filters by status and sorts the matching loaded records", async () => {
    render(<AdminOrders />);
    await screen.findByText("#12");

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "Pending" },
    });
    fireEvent.change(screen.getByLabelText("Sort by"), {
      target: { value: "amount-asc" },
    });

    expect(screen.getByText("#2")).toBeInTheDocument();
    const visibleOrderIds = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.querySelector("td")?.textContent);
    expect(visibleOrderIds).toEqual(["#2", "#4", "#6", "#8", "#10", "#12"]);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing 1–6 of 6 matching; 12 loaded",
    );
  });

  it("shows order items and payment details in the order drawer", async () => {
    const item: OrderItem = {
      id: 31,
      order_id: 12,
      product_id: 81,
      quantity: 2,
      price: 60,
      products: { product_name: "Sketch Book", image_url: null },
    };
    const payment: Payment = {
      id: 41,
      order_id: 12,
      amount: 120,
      payment_method: "upi",
      payment_status: "Completed",
      created_at: new Date(Date.UTC(2025, 0, 12)).toISOString(),
    };
    mockApi.getOrderItems.mockResolvedValue([item]);
    mockApi.getPayments.mockResolvedValue([payment]);

    render(<AdminOrders />);
    fireEvent.click(
      await screen.findByRole("button", { name: "View details for order 12" }),
    );

    const drawer = await screen.findByRole("dialog", { name: "Order #12" });
    expect(drawer).toHaveTextContent("user-12");
    expect(drawer).toHaveTextContent("Pending");
    expect(drawer).toHaveTextContent("₹120.00");
    expect(drawer).toHaveTextContent("Sketch Book");
    expect(drawer).toHaveTextContent("₹60.00 × 2");
    expect(drawer).toHaveTextContent("upi");
    expect(drawer).toHaveTextContent("Completed");
  });
});
