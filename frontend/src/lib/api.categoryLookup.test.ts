import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, getProductsByCategoryNames, mapBackendProduct } from "./api";
import supabase from "./supabase";

vi.mock("./supabase", () => ({
  default: { auth: { getSession: vi.fn() } },
}));

describe("getProductsByCategoryNames", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it("resolves category names to the IDs returned by the categories API", async () => {
    const product = {
      id: 1,
      category_id: 982,
      product_name: "Backend notebook",
      description: null,
      price: 25,
      stock_quantity: 10,
      image_url: null,
      created_at: "",
    };
    const getCategories = vi
      .spyOn(api, "getCategories")
      .mockResolvedValue([{ id: 982, name: "nOtEbOoKs", created_at: "" }]);
    const getProductsByCategory = vi
      .spyOn(api, "getProductsByCategory")
      .mockResolvedValue([product]);

    await expect(getProductsByCategoryNames(["Notebooks"])).resolves.toEqual([
      product,
    ]);

    expect(getCategories).toHaveBeenCalledOnce();
    expect(getProductsByCategory).toHaveBeenCalledOnce();
    expect(getProductsByCategory).toHaveBeenCalledWith(982);
  });

  it("carries backend stock into the product card model", () => {
    const mappedProduct = mapBackendProduct(
      {
        id: 1,
        category_id: 2,
        product_name: "Notebook",
        description: null,
        price: 25,
        stock_quantity: 8,
        image_url: null,
        created_at: "",
      },
      "notebooks",
    );

    expect(mappedProduct.stock_quantity).toBe(8);
  });

  it("uses a response message when an API request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Stock quantity is invalid" }), {
        status: 400,
      }),
    );

    await expect(api.getCategories()).rejects.toThrow(
      "Stock quantity is invalid",
    );
  });
});
