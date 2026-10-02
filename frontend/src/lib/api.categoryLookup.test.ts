import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, getProductsByCategoryNames } from "./api";

vi.mock("./supabase", () => ({
  default: { auth: { getSession: vi.fn() } },
}));

describe("getProductsByCategoryNames", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
});
