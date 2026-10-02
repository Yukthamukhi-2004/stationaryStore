import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { AppContext } from "./AppContextValue";
import { useUser } from "./useUser";
import { api } from "../lib/api";
import type { CartItem } from "./AppContextTypes";

const STORAGE_KEY_CART = "sarada_cart";
const STORAGE_KEY_FAVORITES = "sarada_favorites";
const EMPTY_FAVORITES = new Set<number>();

function favoritesStorageKey(userId?: string): string {
  return userId
    ? `${STORAGE_KEY_FAVORITES}:user:${encodeURIComponent(userId)}`
    : `${STORAGE_KEY_FAVORITES}:guest`;
}

function loadCart(): CartItem[] {
  try {
    const storedCart = localStorage.getItem(STORAGE_KEY_CART);
    if (!storedCart) return [];
    const parsed: unknown = JSON.parse(storedCart);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
  } catch {
    /* silently ignore */
  }
}

function loadFavorites(key: string): Set<number> {
  try {
    const storedFavorites = localStorage.getItem(key);
    if (!storedFavorites) return new Set();
    const parsed: unknown = JSON.parse(storedFavorites);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter(Number.isSafeInteger));
  } catch {
    return new Set();
  }
}

function saveFavorites(key: string, favorites: Set<number>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(favorites)));
  } catch {
    /* silently ignore */
  }
}

type CartItemBackendWithProduct = {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  products?: {
    product_name: string;
    price: number;
    image_url: string | null;
  } | null;
};

type CartRetryAction =
  | { type: "add"; item: CartItem }
  | { type: "remove"; productId: number }
  | { type: "update"; productId: number; delta: number }
  | { type: "clear" }
  | { type: "sync"; userId: string };

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();

  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const cartRef = useRef(cart);
  const [cartError, setCartError] = useState<string | null>(null);
  const cartRetryRef = useRef<CartRetryAction | null>(null);
  const [favoritesState, setFavoritesState] = useState<{
    key: string | null;
    values: Set<number>;
  }>({ key: null, values: EMPTY_FAVORITES });
  const currentFavoritesKey = favoritesStorageKey(user?.id);
  if (isLoaded && favoritesState.key !== currentFavoritesKey) {
    setFavoritesState({
      key: currentFavoritesKey,
      values: loadFavorites(currentFavoritesKey),
    });
  }
  const currentFavorites =
    favoritesState.key === currentFavoritesKey
      ? favoritesState.values
      : EMPTY_FAVORITES;

  const setCurrentCart = useCallback(
    (nextCart: CartItem[] | ((current: CartItem[]) => CartItem[])) => {
      const updatedCart =
        typeof nextCart === "function" ? nextCart(cartRef.current) : nextCart;
      cartRef.current = updatedCart;
      setCart(updatedCart);
    },
    [],
  );

  const clearCartError = useCallback(() => {
    cartRetryRef.current = null;
    setCartError(null);
  }, []);

  const reportCartError = useCallback((retryAction: CartRetryAction) => {
    cartRetryRef.current = retryAction;
    setCartError(
      "Cart could not be saved. Your previous selection was restored.",
    );
  }, []);

  const restoreCartItem = useCallback(
    (productId: number, previousItem: CartItem | undefined) => {
      setCurrentCart((current) => {
        if (!previousItem) {
          return current.filter((item) => item.productId !== productId);
        }
        if (current.some((item) => item.productId === productId)) {
          return current.map((item) =>
            item.productId === productId ? previousItem : item,
          );
        }
        return [...current, previousItem];
      });
    },
    [setCurrentCart],
  );

  // Backend sync state
  const [isOnline, setIsOnline] = useState(false);
  const [backendCartId, setBackendCartId] = useState<number | null>(null);
  // Maps product_id → backend cart_item DB id
  const backendItemIdsRef = useRef<Record<number, number>>({});
  const prevUserRef = useRef<{ id: string; email: string } | null>(null);

  const syncCartOnLogin = useCallback(
    async (userId: string) => {
      clearCartError();
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
        const backendByProduct: Record<
          number,
          { id: number; quantity: number }
        > = {};
        for (const bi of backendItems) {
          backendByProduct[bi.product_id] = {
            id: bi.id,
            quantity: bi.quantity,
          };
        }

        // 3. Build the backendItemIds map
        const idMap: Record<number, number> = {};
        for (const bi of backendItems) {
          idMap[bi.product_id] = bi.id;
        }
        backendItemIdsRef.current = idMap;

        // 4. Merge current in-memory cart into backend
        const localItems = cartRef.current;
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
              const response = await api.createCartItem(
                cartId,
                item.productId,
                item.quantity,
              );
              if (response.item?.[0]) {
                backendItemIdsRef.current[item.productId] = response.item[0].id;
              }
            }
          }
          // Clear local storage cart after merge
          localStorage.removeItem(STORAGE_KEY_CART);
        }

        // 5. Reload cart from backend
        const allItems = (await api.getCartItemsByCartId(
          cartId,
        )) as CartItemBackendWithProduct[];
        const idMapAfter: Record<number, number> = {};
        for (const bi of allItems) {
          idMapAfter[bi.product_id] = bi.id;
        }
        backendItemIdsRef.current = idMapAfter;

        // Map backend items to local CartItem format
        const mergedCart: CartItem[] = allItems.map((bi) => ({
          id: String(bi.product_id),
          productId: bi.product_id,
          name: bi.products?.product_name ?? `Product #${bi.product_id}`,
          price: bi.products?.price ?? 0,
          quantity: bi.quantity,
          image: bi.products?.image_url ?? "",
          category: "",
        }));

        setCurrentCart(mergedCart);
        setIsOnline(true);
        clearCartError();
      } catch (err) {
        console.warn("Cart sync failed, falling back to local:", err);
        setIsOnline(false);
        reportCartError({ type: "sync", userId });
      }
    },
    [clearCartError, reportCartError, setCurrentCart],
  );

  // ── On user sign-in/sign-out: merge local cart into backend and clear sensitive state on sign out ──
  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      const doSync = async () => {
        await syncCartOnLogin(user.id);
      };
      void doSync();
      return;
    }

    // Keep the cart available as a guest cart after sign-out or auth navigation.
    setIsOnline(false);
    setBackendCartId(null);
    backendItemIdsRef.current = {};
  }, [user, isLoaded, syncCartOnLogin]);

  // ── Persist the guest cart and offline cart to localStorage ──
  useEffect(() => {
    if (!isOnline) saveCart(cart);
  }, [cart, isOnline]);

  // Favorites are device-local and isolated by account.
  useEffect(() => {
    if (!isLoaded || favoritesState.key !== currentFavoritesKey) return;
    saveFavorites(currentFavoritesKey, favoritesState.values);
  }, [currentFavoritesKey, favoritesState, isLoaded]);

  // ── Cart Operations ──

  const addToCart = useCallback(
    async (item: CartItem) => {
      const previousItem = cartRef.current.find(
        (cartItem) => cartItem.productId === item.productId,
      );
      const nextQuantity = (previousItem?.quantity ?? 0) + item.quantity;
      clearCartError();

      // Update local state immediately (function updater avoids stale closures)
      setCurrentCart((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          );
        }
        return [...prev, item];
      });

      // Sync to backend if online (use ref to avoid stale closure)
      if (isOnline && backendCartId) {
        try {
          const existingBackendId = backendItemIdsRef.current[item.productId];
          if (existingBackendId) {
            await api.updateCartItem(existingBackendId, nextQuantity);
          } else {
            const response = await api.createCartItem(
              backendCartId,
              item.productId,
              item.quantity,
            );
            if (response.item?.[0]) {
              backendItemIdsRef.current[item.productId] = response.item[0].id;
            }
          }
          clearCartError();
        } catch (err) {
          console.warn("Failed to sync cart add to backend:", err);
          restoreCartItem(item.productId, previousItem);
          reportCartError({ type: "add", item });
        }
      }
    },
    [
      backendCartId,
      clearCartError,
      isOnline,
      reportCartError,
      restoreCartItem,
      setCurrentCart,
    ],
  );

  const removeFromCart = useCallback(
    async (productId: number) => {
      const previousItem = cartRef.current.find(
        (item) => item.productId === productId,
      );
      clearCartError();

      // Update local state immediately
      setCurrentCart((prev) => prev.filter((i) => i.productId !== productId));

      // Sync to backend if online
      if (isOnline && productId) {
        const backendId = backendItemIdsRef.current[productId];
        if (backendId) {
          try {
            await api.deleteCartItem(backendId);
            delete backendItemIdsRef.current[productId];
            clearCartError();
          } catch (err) {
            console.warn("Failed to sync cart remove to backend:", err);
            restoreCartItem(productId, previousItem);
            reportCartError({ type: "remove", productId });
          }
        }
      }
    },
    [
      clearCartError,
      isOnline,
      reportCartError,
      restoreCartItem,
      setCurrentCart,
    ],
  );

  const updateQuantity = useCallback(
    async (productId: number, delta: number) => {
      const item = cartRef.current.find(
        (cartItem) => cartItem.productId === productId,
      );
      if (!item) return;

      const newQty = Math.max(0, item.quantity + delta);
      clearCartError();

      if (newQty === 0) {
        // Remove from local state
        setCurrentCart((prev) => prev.filter((i) => i.productId !== productId));

        // Delete from backend
        if (isOnline && item) {
          const backendId = backendItemIdsRef.current[productId];
          if (backendId) {
            try {
              await api.deleteCartItem(backendId);
              delete backendItemIdsRef.current[productId];
              clearCartError();
            } catch (err) {
              console.warn("Failed to sync quantity update to backend:", err);
              restoreCartItem(productId, item);
              reportCartError({ type: "update", productId, delta });
            }
          }
        }
      } else {
        // Update local quantity
        setCurrentCart((prev) =>
          prev.map((i) =>
            i.productId === productId ? { ...i, quantity: newQty } : i,
          ),
        );

        // Sync to backend
        if (isOnline && item) {
          const backendId = backendItemIdsRef.current[productId];
          if (backendId) {
            try {
              await api.updateCartItem(backendId, newQty);
              clearCartError();
            } catch (err) {
              console.warn("Failed to sync quantity update to backend:", err);
              restoreCartItem(productId, item);
              reportCartError({ type: "update", productId, delta });
            }
          }
        }
      }
    },
    [
      clearCartError,
      isOnline,
      reportCartError,
      restoreCartItem,
      setCurrentCart,
    ],
  );

  const clearCart = useCallback(async () => {
    clearCartError();
    // Delete all backend items first
    if (isOnline) {
      for (const [productId, backendId] of Object.entries(
        backendItemIdsRef.current,
      )) {
        try {
          await api.deleteCartItem(backendId);
          delete backendItemIdsRef.current[Number(productId)];
        } catch (err) {
          console.warn("Failed to sync cart clear to backend:", err);
          reportCartError({ type: "clear" });
          return;
        }
      }
      backendItemIdsRef.current = {};
    }

    // Clear local state
    setCurrentCart([]);
    localStorage.removeItem(STORAGE_KEY_CART);
    clearCartError();
  }, [clearCartError, isOnline, reportCartError, setCurrentCart]);

  const retryCartAction = useCallback(() => {
    const action = cartRetryRef.current;
    if (!action) return;

    clearCartError();
    switch (action.type) {
      case "add":
        void addToCart(action.item);
        break;
      case "remove":
        void removeFromCart(action.productId);
        break;
      case "update":
        void updateQuantity(action.productId, action.delta);
        break;
      case "clear":
        void clearCart();
        break;
      case "sync":
        void syncCartOnLogin(action.userId);
        break;
    }
  }, [
    addToCart,
    clearCart,
    clearCartError,
    removeFromCart,
    syncCartOnLogin,
    updateQuantity,
  ]);

  const toggleFavorite = useCallback(
    (productId: number) => {
      if (favoritesState.key !== currentFavoritesKey) return;
      setFavoritesState((prev) => {
        const next = new Set(prev.values);
        if (next.has(productId)) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return { key: currentFavoritesKey, values: next };
      });
    },
    [currentFavoritesKey, favoritesState.key],
  );

  const isFavorite = useCallback(
    (productId: number) => currentFavorites.has(productId),
    [currentFavorites],
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
        cartError,
        favorites: currentFavorites,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        retryCartAction,
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
