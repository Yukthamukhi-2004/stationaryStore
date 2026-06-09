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
  // Products
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

  // Orders
  async getOrders(): Promise<Order[]> {
    return request<Order[]>("/orders");
  },

  async createOrder(order: OrderInput): Promise<{ message: string; order: Order[] }> {
    return request<{ message: string; order: Order[] }>("/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  },

  async getOrder(id: number): Promise<Order> {
    return request<Order>(`/orders/${id}`);
  },

  async updateOrder(id: number, order: Partial<OrderInput>): Promise<{ message: string }> {
    return request<{ message: string }>(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(order),
    });
  },

  // Cart
  async getCarts(): Promise<Cart[]> {
    return request<Cart[]>("/carts");
  },

  async createCart(user_id: string): Promise<{ message: string; cart: Cart[] }> {
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

  async createCartItem(cart_id: number, product_id: number, quantity: number): Promise<{ message: string; item: CartItemBackend[] }> {
    return request<{ message: string; item: CartItemBackend[] }>("/cart-items", {
      method: "POST",
      body: JSON.stringify({ cart_id, product_id, quantity }),
    });
  },

  // Checkout
  async checkout(input: CheckoutInput): Promise<{ message: string; order: Order; payment: Payment }> {
    return request("/checkout", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    return request<Payment[]>("/payments");
  },

  async createPayment(payment: { order_id: number; amount: number; payment_method: string; payment_status?: string }): Promise<{ message: string; payment: Payment[] }> {
    return request<{ message: string; payment: Payment[] }>("/payments", {
      method: "POST",
      body: JSON.stringify(payment),
    });
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
    image: p.image_url || `https://placehold.co/200x200/F5F0EB/2c2420?text=${encodeURIComponent(p.product_name)}`,
    category,
  };
}
