const API_BASE = "/api";

import type { ProductItem } from "../data/products";

export type Category = {
  id: number;
  name: string;
  created_at: string;
};

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

export type Order = {
  id: number;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
};

export type OrderInput = {
  user_id: string;
  total_amount: number;
  status?: string;
};

export type Cart = {
  id: number;
  user_id: string;
  created_at: string;
};

export type CartItemBackend = {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
};

export type CheckoutInput = {
  user_id: string;
  product_id: number;
  quantity: number;
  payment_method: string;
};

export type Payment = {
  id: number;
  order_id: number;
  amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
};

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
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

export type Purchase = {
  id: number;
  type: "dealer_invoice" | "stock_purchase";
  dealer_name: string | null;
  invoice_number: string | null;
  description: string | null;
  amount: number;
  created_at: string;
};

export type PurchaseInput = {
  type: "dealer_invoice" | "stock_purchase";
  dealer_name?: string | null;
  invoice_number?: string | null;
  description?: string | null;
  amount: number;
};

export type PaginationMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type PurchasesResponse = {
  data: Purchase[];
  pagination: PaginationMeta;
};

// ===== Newly exposed types (previously only used via direct fetch) =====

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  products: {
    product_name: string;
    image_url: string | null;
  } | null;
};

export type LowStockProduct = {
  id: number;
  product_name: string;
  stock_quantity: number;
  price: number;
  category_id: number | null;
  image_url: string | null;
};

export type LowStockResponse = {
  threshold: number;
  count: number;
  products: LowStockProduct[];
};

export type ReorderSuggestion = {
  id: number;
  product_name: string;
  current_stock: number;
  suggested_reorder_qty: number;
  estimated_cost: number;
  price: number;
  category_id: number | null;
};

export type ReorderResponse = {
  threshold: number;
  count: number;
  total_estimated_cost: number;
  suggestions: ReorderSuggestion[];
};

export type BulkRestockResult = {
  product_id: number;
  new_stock: number;
  message: string;
};

export type BulkRestockError = {
  product_id: number;
  error: string;
};

export type BulkRestockResponse = {
  message: string;
  results: BulkRestockResult[];
  errors?: BulkRestockError[];
};

export type DashboardStats = {
  total_orders: number;
  total_products: number;
  total_categories: number;
  total_revenue: number;
  completed_payments: number;
  order_status_breakdown: Record<string, number>;
  dealer_invoice_count: number;
  customer_invoice_count: number;
  stock_purchase_count: number;
  stock_purchase_value: number;
};

export type RevenueAnalytics = {
  total_revenue: number;
  monthly: { month: string; revenue: number }[];
  payment_method_breakdown: Record<string, number>;
};

export type OrderAnalytics = {
  total_orders: number;
  average_order_value: number;
  monthly: { month: string; count: number }[];
  status_distribution: Record<string, number>;
};

export type InventoryAnalytics = {
  total_products: number;
  total_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
  average_price: number;
  low_stock_items: { id: number; product_name: string; stock_quantity: number; price: number }[];
};

export const api = {
  // Products
  async getProducts(): Promise<Product[]> {
    return request<Product[]>("/products");
  },

  async getProduct(id: number): Promise<Product> {
    return request<Product>(`/products/${id}`);
  },

  async createProduct(
    product: ProductInput,
  ): Promise<{ message: string; product: Product[] }> {
    return request<{ message: string; product: Product[] }>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  },

  async updateProduct(
    id: number,
    product: Partial<ProductInput>,
  ): Promise<{ message: string }> {
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

  // Orders
  async getOrders(): Promise<Order[]> {
    return request<Order[]>("/orders");
  },

  async createOrder(
    order: OrderInput,
  ): Promise<{ message: string; order: Order[] }> {
    return request<{ message: string; order: Order[] }>("/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  },

  async getOrder(id: number): Promise<Order> {
    return request<Order>(`/orders/${id}`);
  },

  async updateOrder(
    id: number,
    order: Partial<OrderInput>,
  ): Promise<{ message: string }> {
    return request<{ message: string }>(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(order),
    });
  },

  // Cart
  async getCarts(): Promise<Cart[]> {
    return request<Cart[]>("/carts");
  },

  async getCartByUserId(
    user_id: string,
  ): Promise<Cart> {
    return request<Cart>(`/carts/user/${encodeURIComponent(user_id)}`);
  },

  async createCart(
    user_id: string,
  ): Promise<{ message: string; cart: Cart[] }> {
    return request<{ message: string; cart: Cart[] }>("/carts", {
      method: "POST",
      body: JSON.stringify({ user_id }),
    });
  },

  async getCart(id: number): Promise<Cart> {
    return request<Cart>(`/carts/${id}`);
  },

  // Cart Items
  async getCartItems(): Promise<CartItemBackend[]> {
    return request<CartItemBackend[]>("/cart-items");
  },

  async getCartItemsByCartId(cart_id: number): Promise<CartItemBackend[]> {
    return request<CartItemBackend[]>(`/cart-items/cart/${cart_id}`);
  },

  async createCartItem(
    cart_id: number,
    product_id: number,
    quantity: number,
  ): Promise<{ message: string; item: CartItemBackend[] }> {
    return request<{ message: string; item: CartItemBackend[] }>(
      "/cart-items",
      {
        method: "POST",
        body: JSON.stringify({ cart_id, product_id, quantity }),
      },
    );
  },

  async updateCartItem(
    id: number,
    quantity: number,
  ): Promise<{ message: string; item: CartItemBackend }> {
    return request<{ message: string; item: CartItemBackend }>(`/cart-items/${id}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  },

  async deleteCartItem(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/cart-items/${id}`, {
      method: "DELETE",
    });
  },

  // Checkout
  async checkout(
    input: CheckoutInput,
  ): Promise<{ message: string; order: Order; payment: Payment }> {
    return request("/checkout", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    return request<Payment[]>("/payments");
  },

  async createPayment(payment: {
    order_id: number;
    amount: number;
    payment_method: string;
    payment_status?: string;
  }): Promise<{ message: string; payment: Payment[] }> {
    return request<{ message: string; payment: Payment[] }>("/payments", {
      method: "POST",
      body: JSON.stringify(payment),
    });
  },

  // Profile
  async getProfile(
    user_id: string,
  ): Promise<{
    id: number;
    clerk_id: string;
    name: string | null;
    role: string | null;
    age: number | null;
    profession: string | null;
    address: string | null;
    created_at: string | null;
    updated_at: string | null;
  }> {
    return request(`/profile/${encodeURIComponent(user_id)}`);
  },

  async createProfile(data: {
    clerk_id: string;
    name?: string | null;
  }): Promise<{ message: string; profile: { id: number; clerk_id: string; name: string | null; role: string } }> {
    return request("/profile", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateProfile(
    user_id: string,
    data: { name?: string | null; role?: string | null; age?: number | null; profession?: string | null; address?: string | null },
  ): Promise<{
    message: string;
    profile: {
      id: number;
      clerk_id: string;
      name: string | null;
      role: string | null;
      age: number | null;
      profession: string | null;
      address: string | null;
      created_at: string | null;
      updated_at: string | null;
    };
  }> {
    return request(`/profile/${encodeURIComponent(user_id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Purchases
  async getPurchases(params?: { type?: string; dealer_name?: string; date_from?: string; date_to?: string; page?: number; per_page?: number }): Promise<PurchasesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.dealer_name) searchParams.set("dealer_name", params.dealer_name);
    if (params?.date_from) searchParams.set("date_from", params.date_from);
    if (params?.date_to) searchParams.set("date_to", params.date_to);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.per_page) searchParams.set("per_page", String(params.per_page));
    const qs = searchParams.toString();
    return request<PurchasesResponse>(`/purchases${qs ? `?${qs}` : ""}`);
  },

  async getAllPurchasesForExport(params?: { type?: string; dealer_name?: string; date_from?: string; date_to?: string }): Promise<Purchase[]> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.dealer_name) searchParams.set("dealer_name", params.dealer_name);
    if (params?.date_from) searchParams.set("date_from", params.date_from);
    if (params?.date_to) searchParams.set("date_to", params.date_to);
    // Fetch up to 10000 records for export
    searchParams.set("per_page", "10000");
    searchParams.set("page", "1");
    const qs = searchParams.toString();
    const response = await request<PurchasesResponse>(`/purchases${qs ? `?${qs}` : ""}`);
    return response.data;
  },

  async getPurchase(id: number): Promise<Purchase> {
    return request<Purchase>(`/purchases/${id}`);
  },

  async createPurchase(
    purchase: PurchaseInput,
  ): Promise<{ message: string; purchase: Purchase }> {
    return request<{ message: string; purchase: Purchase }>("/purchases", {
      method: "POST",
      body: JSON.stringify(purchase),
    });
  },

  async updatePurchase(
    id: number,
    purchase: Partial<PurchaseInput>,
  ): Promise<{ message: string; purchase: Purchase }> {
    return request<{ message: string; purchase: Purchase }>(`/purchases/${id}`, {
      method: "PUT",
      body: JSON.stringify(purchase),
    });
  },

  async deletePurchase(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/purchases/${id}`, {
      method: "DELETE",
    });
  },

  // Categories
  // Order Items
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return request<OrderItem[]>(`/orders/${orderId}/items`);
  },

  // Low Stock
  async getLowStockProducts(threshold?: number): Promise<LowStockResponse> {
    const qs = threshold ? `?threshold=${threshold}` : "";
    return request<LowStockResponse>(`/low-stock${qs}`);
  },

  async restockProduct(id: number, quantity: number): Promise<{ message: string; product: Product }> {
    return request<{ message: string; product: Product }>(`/low-stock/${id}/restock`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  },

  // Reorder
  async getReorderSuggestions(threshold?: number): Promise<ReorderResponse> {
    const qs = threshold ? `?threshold=${threshold}` : "";
    return request<ReorderResponse>(`/reorder/suggestions${qs}`);
  },

  async bulkRestock(items: { product_id: number; quantity: number }[]): Promise<BulkRestockResponse> {
    return request<BulkRestockResponse>("/reorder/bulk-restock", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>("/dashboard/stats");
  },

  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    return request<RevenueAnalytics>("/dashboard/revenue-analytics");
  },

  async getOrderAnalytics(): Promise<OrderAnalytics> {
    return request<OrderAnalytics>("/dashboard/order-analytics");
  },

  async getInventoryAnalytics(): Promise<InventoryAnalytics> {
    return request<InventoryAnalytics>("/dashboard/inventory-analytics");
  },

  // Upload
  async uploadImage(file: File, productId?: number): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("image", file);
    if (productId) formData.append("productId", String(productId));
    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || `Upload failed with status ${res.status}`);
    }
    return res.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return request<Category[]>("/categories");
  },

  async getCategory(id: number): Promise<Category> {
    return request<Category>(`/categories/${id}`);
  },
};

/** Map a backend Product to the frontend ProductItem format used by ProductCard */
export function mapBackendProduct(p: Product, category: string): ProductItem {
  return {
    id: p.id,
    name: p.product_name,
    price: p.price,
    image:
      p.image_url ||
      `https://placehold.co/200x200/F5F0EB/2c2420?text=${encodeURIComponent(p.product_name)}`,
    category,
  };
}


