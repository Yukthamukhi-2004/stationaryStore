import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { AppContext } from "./AppContextValue";
import { useUser } from "./useUser";
import { api } from "../lib/api";
import type { CartItem } from "./AppContextTypes";

const STORAGE_KEY_CART = "sarada_cart";
const STORAGE_KEY_FAVORITES = "sarada_favorites";

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

function saveCart(cart: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
  } catch {
    /* silently ignore */
  }
}

function saveFavorites(favorites: Set<number>) {
  try {
    localStorage.setItem(
      STORAGE_KEY_FAVORITES,
      JSON.stringify(Array.from(favorites)),
    );
  } catch {
    /* silently ignore */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();

  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [favorites, setFavorites] = useState<Set<number>>(loadFavorites);

  // Backend sync state
  const [isOnline, setIsOnline] = useState(false);
  const [backendCartId, setBackendCartId] = useState<number | null>(null);
  // Maps product_id → backend cart_item DB id
  const backendItemIdsRef = useRef<Record<number, number>>({});
  // Ref to track latest cart quantities (avoids stale closure issues)
  const cartQuantitiesRef = useRef<Record<string, number>>({});

  // Keep quantities ref in sync with cart state
  useEffect(() => {
    const q: Record<string, number> = {};
    for (const item of cart) {
      q[item.id] = item.quantity;
    }
    cartQuantitiesRef.current = q;
  }, [cart]);

  // ── On user sign-in: merge local cart into backend ──
  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      syncCartOnLogin(user.id);
    } else {
      // User signed out — revert to local-only
      setIsOnline(false);
      setBackendCartId(null);
      backendItemIdsRef.current = {};
      // Cart stays in state (preserved for next anonymous session)
    }
  }, [user?.id, isLoaded]);

  async function syncCartOnLogin(userId: string) {
    try {
      // 1. Find or create backend cart
      let cartId: number;
      try {
        const existingCart = await api.getCartByUserId(userId);
        cartId = existingCart.id;
      } catch {
        // No cart exists — create one
        const { cart } = await api.createCart(userId);
        cartId = cart[0].id;
      }

      setBackendCartId(cartId);

      // 2. Get existing backend items
      const backendItems = await api.getCartItemsByCartId(cartId);
      const backendByProduct: Record<number, { id: number; quantity: number }> = {};
      for (const bi of backendItems) {
        backendByProduct[bi.product_id] = { id: bi.id, quantity: bi.quantity };
      }

      // 3. Build the backendItemIds map
      const idMap: Record<number, number> = {};
      for (const bi of backendItems) {
        idMap[bi.product_id] = bi.id;
      }
      backendItemIdsRef.current = idMap;

      // 4. Merge local cart into backend
      const localItems = loadCart();
      if (localItems.length > 0) {
        for (const item of localItems) {
          const existingBackend = backendByProduct[item.productId];
          if (existingBackend) {
            // Update quantity if local has more
            const newQty = Math.max(existingBackend.quantity, item.quantity);
            if (newQty !== existingBackend.quantity) {
              await api.updateCartItem(existingBackend.id, newQty);
            }
          } else {
            // Add new item to backend
            const response = await api.createCartItem(cartId, item.productId, item.quantity);
            if (response.item?.[0]) {
              backendItemIdsRef.current[item.productId] = response.item[0].id;
            }
          }
        }
        // Clear local storage cart after merge
        localStorage.removeItem(STORAGE_KEY_CART);
      }

      // 5. Reload cart from backend
      const allItems = await api.getCartItemsByCartId(cartId);
      const idMapAfter: Record<number, number> = {};
      for (const bi of allItems) {
        idMapAfter[bi.product_id] = bi.id;
      }
      backendItemIdsRef.current = idMapAfter;

      // Map backend items to local CartItem format
      const mergedCart: CartItem[] = allItems.map((bi) => ({
        id: `backend-${bi.product_id}`,
        productId: bi.product_id,
        name: (bi as any).products?.product_name ?? `Product #${bi.product_id}`,
        price: (bi as any).products?.price ?? 0,
        quantity: bi.quantity,
        image: (bi as any).products?.image_url ?? "",
        category: "",
      }));

      setCart(mergedCart);
      setIsOnline(true);
    } catch (err) {
      console.warn("Cart sync failed, falling back to local:", err);
      setIsOnline(false);
    }
  }

  // ── Persist cart to localStorage (only when offline) ──
  useEffect(() => {
    if (!isOnline) {
      saveCart(cart);
    }
  }, [cart, isOnline]);

  // Persist favorites to localStorage (always)
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  // ── Cart Operations ──

  const addToCart = useCallback(
    async (item: CartItem) => {
      // Update local state immediately (function updater avoids stale closures)
      setCart((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          return prev.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i,
          );
        }
        return [...prev, item];
      });

      // Sync to backend if online (use ref to avoid stale closure)
      if (isOnline && backendCartId) {
        try {
          const existingBackendId = backendItemIdsRef.current[item.productId];
          if (existingBackendId) {
            const currentQty = cartQuantitiesRef.current[item.id] ?? 0;
            const newQty = currentQty + item.quantity;
            await api.updateCartItem(existingBackendId, newQty);
          } else {
            const response = await api.createCartItem(backendCartId, item.productId, item.quantity);
            if (response.item?.[0]) {
              backendItemIdsRef.current[item.productId] = response.item[0].id;
            }
          }
        } catch (err) {
          console.warn("Failed to sync cart add to backend:", err);
        }
      }
    },
    [isOnline, backendCartId],
  );

  const removeFromCart = useCallback(
    async (id: string) => {
      // Find the productId from the ref before removing
      const productId = cartQuantitiesRef.current[id] !== undefined
        ? cart.find((i) => i.id === id)?.productId
        : undefined;

      // Update local state immediately
      setCart((prev) => prev.filter((i) => i.id !== id));

      // Sync to backend if online
      if (isOnline && productId) {
        const backendId = backendItemIdsRef.current[productId];
        if (backendId) {
          try {
            await api.deleteCartItem(backendId);
            delete backendItemIdsRef.current[productId];
          } catch (err) {
            console.warn("Failed to sync cart remove to backend:", err);
          }
        }
      }
    },
    [isOnline, cart],
  );

  const updateQuantity = useCallback(
    async (id: string, delta: number) => {
      const currentQty = cartQuantitiesRef.current[id];
      if (currentQty === undefined) return;

      const newQty = Math.max(0, currentQty + delta);

      // Find productId from the current cart for backend sync
      const item = cart.find((i) => i.id === id);
      const productId = item?.productId;

      if (newQty === 0) {
        // Remove from local state
        setCart((prev) => prev.filter((i) => i.id !== id));

        // Delete from backend
        if (isOnline && productId) {
          const backendId = backendItemIdsRef.current[productId];
          if (backendId) {
            try {
              await api.deleteCartItem(backendId);
              delete backendItemIdsRef.current[productId];
            } catch (err) {
              console.warn("Failed to sync quantity update to backend:", err);
            }
          }
        }
      } else {
        // Update local quantity
        setCart((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, quantity: newQty } : i,
          ),
        );

        // Sync to backend
        if (isOnline && productId) {
          const backendId = backendItemIdsRef.current[productId];
          if (backendId) {
            try {
              await api.updateCartItem(backendId, newQty);
            } catch (err) {
              console.warn("Failed to sync quantity update to backend:", err);
            }
          }
        }
      }
    },
    [isOnline, cart],
  );

  const clearCart = useCallback(async () => {
    // Delete all backend items first
    if (isOnline) {
      const ids = Object.values(backendItemIdsRef.current);
      for (const backendId of ids) {
        try {
          await api.deleteCartItem(backendId);
        } catch {
          // Continue deleting remaining
        }
      }
      backendItemIdsRef.current = {};
    }

    // Clear local state
    setCart([]);
    localStorage.removeItem(STORAGE_KEY_CART);
  }, [isOnline]);

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

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
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
        isCartOnline: isOnline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
