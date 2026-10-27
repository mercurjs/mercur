'use client';

import { createContext, PropsWithChildren, useCallback, useContext, useState } from 'react';

interface CartDrawerContextValue {
  closeDrawer: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function CartDrawerProvider({ children }: PropsWithChildren) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <CartDrawerContext.Provider value={{ closeDrawer, isDrawerOpen, openDrawer }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);
  if (!context) {
    throw new Error('useCartDrawer must be used within a CartProvider');
  }
  return context;
}
