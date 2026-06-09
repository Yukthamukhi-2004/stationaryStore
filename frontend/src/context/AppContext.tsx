import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type CartItem = {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
};

const STORAGE_KEY_CART = "stationery_cart";
const STORAGE_KEY_FAVORITES = "stationery_favorites";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CART);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function loadFavorites(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
    return raw ? new Set<number>(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

type AppContextType = {
  cart: CartItem[];
  favorites: Set<number>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [favorites, setFavorites] = useState<Set<number>>(loadFavorites);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
    } catch { /* quota exceeded - silently ignore */ }
  }, [cart]);

  // Persist favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(Array.from(favorites)));
    } catch { /* silently ignore */ }
  }, [favorites]);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i,
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleFavorite = useCallback((productId: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (productId: number) => favorites.has(productId),
    [favorites],
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        cart,
        favorites,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
