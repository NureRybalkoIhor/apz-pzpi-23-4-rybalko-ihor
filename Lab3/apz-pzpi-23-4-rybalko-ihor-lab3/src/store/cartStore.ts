import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Dish } from '../types';

interface CartState {
  items: CartItem[];
  restaurantId: number | null;
  restaurantName: string | null;
  addItem: (dish: Dish, restaurantId: number, restaurantName: string) => void;
  removeItem: (dishId: number) => void;
  updateQuantity: (dishId: number, quantity: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,

      addItem: (dish, restaurantId, restaurantName) => {
        const state = get();
        if (state.restaurantId && state.restaurantId !== restaurantId) {
          set({ items: [{ dish, quantity: 1 }], restaurantId, restaurantName });
          return;
        }
        const existing = state.items.find((i) => i.dish.id === dish.id);
        if (existing) {
          set({
            items: state.items.map((i) => i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i),
            restaurantId, restaurantName,
          });
        } else {
          set({ items: [...state.items, { dish, quantity: 1 }], restaurantId, restaurantName });
        }
      },

      removeItem: (dishId) => set((state) => {
        const newItems = state.items.filter((i) => i.dish.id !== dishId);
        return { items: newItems, restaurantId: newItems.length === 0 ? null : state.restaurantId, restaurantName: newItems.length === 0 ? null : state.restaurantName };
      }),

      updateQuantity: (dishId, quantity) => set((state) => ({
        items: quantity <= 0 ? state.items.filter((i) => i.dish.id !== dishId) : state.items.map((i) => i.dish.id === dishId ? { ...i, quantity } : i),
      })),

      clearCart: () => set({ items: [], restaurantId: null, restaurantName: null }),

      totalPrice: () => get().items.reduce((sum, i) => sum + i.dish.price * i.quantity, 0),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'cart-storage' }
  )
);
