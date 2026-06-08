const API_BASE = "/api";

export type Product = {
  id: number;
  category_id: number | null;
  product_name: string;
  description: string | null;
  price: number;
  stock_quantity: number | null;
  image_url: string | null;
  created_at: string;
};

export type ProductInput = {
  category_id?: number | null;
  product_name: string;
  description?: string | null;
  price: number;
  stock_quantity?: number | null;
  image_url?: string | null;
};

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  async getProducts(): Promise<Product[]> {
    return request<Product[]>("/products");
  },

  async getProduct(id: number): Promise<Product> {
    return request<Product>(`/products/${id}`);
  },

  async createProduct(product: ProductInput): Promise<{ message: string; product: Product[] }> {
    return request<{ message: string; product: Product[] }>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  },

  async updateProduct(id: number, product: Partial<ProductInput>): Promise<{ message: string }> {
    return request<{ message: string }>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  },

  async deleteProduct(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/products/${id}`, {
      method: "DELETE",
    });
  },
};
