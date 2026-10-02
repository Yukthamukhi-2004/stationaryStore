import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";

vi.mock("./components/ShoppingLayout", () => ({
  default: () => <Outlet />,
}));

vi.mock("./pages/HomePage", () => ({
  default: () => <h1>Store Home</h1>,
}));

describe("main shopping entry", () => {
  it.each(["/", "/landing"])(
    "opens the store directly from %s",
    async (path) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>,
      );

      expect(
        await screen.findByRole("heading", { name: "Store Home" }),
      ).toBeInTheDocument();
    },
  );
});
