'use client';

import { createContext, use, useContext } from 'react';

import { Cart, StoreCartLineItemOptimisticUpdate } from '@/types/cart';

interface AddToCartParams {
  countryCode: string;
  offerId: string;
  optimisticItem?: { currencyCode: string; item: StoreCartLineItemOptimisticUpdate };
  quantity: number;
}

export interface CartContextValue {
  addToCart: (seededCart: Cart | null, params: AddToCartParams) => Promise<void>;
  cartPromise: Promise<Cart | null>;
  isAddingItem: boolean;
  isRemovingItem: boolean;
  isUpdatingItem: boolean;
  optimisticCart: Cart | null | undefined;
  removeCartItem: (seededCart: Cart | null, lineId: string) => Promise<void>;
  updateCartItem: (seededCart: Cart | null, lineId: string, quantity: number) => Promise<void>;
}

export const CartContext = createContext<CartContextValue | null>(null);

// Suspends until the streamed server cart resolves, so callers that render cart
// data belong under a Suspense boundary whose fallback matches their geometry.
export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }

  const seededCart = use(context.cartPromise);
  const cart = context.optimisticCart === undefined ? seededCart : context.optimisticCart;

  return {
    addToCart: (params: AddToCartParams) => context.addToCart(seededCart, params),
    cart,
    isAddingItem: context.isAddingItem,
    isRemovingItem: context.isRemovingItem,
    isUpdating: context.isAddingItem || context.isRemovingItem || context.isUpdatingItem,
    isUpdatingItem: context.isUpdatingItem,
    removeCartItem: (lineId: string) => context.removeCartItem(seededCart, lineId),
    updateCartItem: (lineId: string, quantity: number) =>
      context.updateCartItem(seededCart, lineId, quantity)
  };
}
