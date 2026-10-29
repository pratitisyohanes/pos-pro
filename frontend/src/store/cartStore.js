import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Customer cart for self-orders; prices are shown here but the server recalculates them
export const useCartStore = create(
  persist(
    (set) => ({
      lines: [],
      add: (product, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((line) => line.productId === product.id);
          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.productId === product.id ? { ...line, quantity: Math.min(line.quantity + quantity, product.stock) } : line,
              ),
            };
          }
          const line = { productId: product.id, sku: product.sku, name: product.name, unit: product.unit, price: Number(product.price), stock: product.stock, quantity };
          return { lines: [...state.lines, line] };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({ lines: state.lines.map((line) => (line.productId === productId ? { ...line, quantity } : line)) })),
      remove: (productId) => set((state) => ({ lines: state.lines.filter((line) => line.productId !== productId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'pos-cart' },
  ),
);

export const selectCartCount = (state) => state.lines.reduce((sum, line) => sum + line.quantity, 0);
export const selectCartTotal = (state) => state.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
