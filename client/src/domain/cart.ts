import type { Product } from "@shared/schema";

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  price: string;
  stock: number;
  quantity: number;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

// Pure functions for cart operations

/**
 * Add item to cart immutably
 */
export const addItemToCart = (cart: CartItem[], newItem: Omit<CartItem, 'quantity'>): CartItem[] => {
  const existingItemIndex = cart.findIndex(item => item.id === newItem.id);
  
  if (existingItemIndex >= 0) {
    const existingItem = cart[existingItemIndex];
    if (existingItem.quantity >= newItem.stock) {
      return cart; // Cannot add more items than stock
    }
    
    return cart.map((item, index) =>
      index === existingItemIndex
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  }
  
  return [...cart, { ...newItem, quantity: 1 }];
};

/**
 * Remove item from cart immutably
 */
export const removeItemFromCart = (cart: CartItem[], itemId: string): CartItem[] =>
  cart.filter(item => item.id !== itemId);

/**
 * Update item quantity immutably
 */
export const updateItemQuantity = (cart: CartItem[], itemId: string, quantity: number): CartItem[] => {
  if (quantity <= 0) {
    return removeItemFromCart(cart, itemId);
  }
  
  return cart.map(item =>
    item.id === itemId
      ? { ...item, quantity: Math.min(quantity, item.stock) }
      : item
  );
};

/**
 * Clear cart
 */
export const clearCart = (): CartItem[] => [];

/**
 * Calculate cart totals
 */
export const calculateCartSummary = (cart: CartItem[], taxRate: number = 0.12): CartSummary => {
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount
  };
};

/**
 * Check if cart is empty
 */
export const isCartEmpty = (cart: CartItem[]): boolean => cart.length === 0;

/**
 * Get cart item by ID
 */
export const getCartItem = (cart: CartItem[], itemId: string): CartItem | undefined =>
  cart.find(item => item.id === itemId);

/**
 * Convert Product to CartItem
 */
export const productToCartItem = (product: Product): Omit<CartItem, 'quantity'> => ({
  id: product.id,
  sku: product.sku,
  name: product.name,
  price: product.price,
  stock: product.stock
});