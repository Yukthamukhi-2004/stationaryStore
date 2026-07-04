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
  favorites: Set<number>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  isCartOnline: boolean;
};
