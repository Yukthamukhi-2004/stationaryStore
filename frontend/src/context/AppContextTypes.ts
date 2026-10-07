export type CartItem = {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
};

export type AppContextType = {
  cart: CartItem[];
  cartError: string | null;
  pendingProductIds: ReadonlySet<number>;
  favorites: Set<number>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, delta: number) => void;
  clearCart: () => void;
  retryCartAction: () => void;
  cartTotal: number;
  cartCount: number;
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  isCartOnline: boolean;
};
