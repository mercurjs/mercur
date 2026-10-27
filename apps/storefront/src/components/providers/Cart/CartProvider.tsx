'use client';

import { PropsWithChildren, useOptimistic, useState, useTransition } from 'react';

import {
  addToCart as apiAddToCart,
  deleteLineItem as apiDeleteLineItem,
  updateLineItem as apiUpdateLineItem,
  retrieveCart
} from '@/lib/data/cart';
import { Cart, StoreCartLineItemOptimisticUpdate } from '@/types/cart';

import { CartContext, type CartContextValue } from './context';

interface CartProviderProps extends PropsWithChildren {
  cartPromise: Promise<Cart | null>;
}

type OptimisticCartAction =
  | { type: 'add'; item?: StoreCartLineItemOptimisticUpdate; currencyCode: string }
  | { type: 'update'; lineId: string; quantity: number }
  | { type: 'remove'; lineId: string };

function getItemsSummaryValues(items: StoreCartLineItemOptimisticUpdate[]) {
  return items.reduce<{ item_subtotal: number; total: number; tax_total: number }>(
    (acc, item) => ({
      item_subtotal: acc.item_subtotal + (item.subtotal || 0),
      total: acc.total + (item.total || 0),
      tax_total: acc.tax_total + (item.tax_total || 0)
    }),
    { item_subtotal: 0, total: 0, tax_total: 0 }
  );
}

function applyOptimisticAction(cart: Cart | null, action: OptimisticCartAction): Cart | null {
  if (action.type === 'update') {
    if (!cart?.items) return cart;
    return {
      ...cart,
      items: cart.items.map(item =>
        item.id === action.lineId ? { ...item, quantity: action.quantity } : item
      )
    };
  }

  if (action.type === 'remove') {
    if (!cart?.items) return cart;
    return { ...cart, items: cart.items.filter(item => item.id !== action.lineId) };
  }

  const { item: newItem, currencyCode } = action;
  if (!newItem) return cart;

  const currentItems = (cart?.items || []) as StoreCartLineItemOptimisticUpdate[];
  const offerId = newItem.metadata?.offer_id;
  const existing = currentItems.find(item => item.metadata?.offer_id === offerId);

  const items = existing
    ? currentItems.map(item => {
        if (item !== existing) return item;
        const quantity = (item.quantity || 0) + (newItem.quantity || 0);
        return {
          ...item,
          quantity,
          subtotal: quantity * (newItem.subtotal || 0),
          total: quantity * (newItem.total || 0),
          tax_total: quantity * (newItem.tax_total || 0)
        };
      })
    : [...currentItems, newItem];

  return {
    ...cart,
    ...getItemsSummaryValues(items),
    items,
    currency_code: currencyCode
  } as Cart;
}

export function CartProvider({ cartPromise, children }: CartProviderProps) {
  const [seed, setSeed] = useState(cartPromise);
  // undefined = no mutation yet: read the streamed seed, which a revalidated layout replaces.
  const [confirmedCart, setConfirmedCart] = useState<Cart | null | undefined>(undefined);

  if (seed !== cartPromise) {
    setSeed(cartPromise);
    setConfirmedCart(undefined);
  }

  const [optimisticCart, applyOptimistic] = useOptimistic<
    Cart | null | undefined,
    OptimisticCartAction
  >(confirmedCart, (cart, action) =>
    cart === undefined ? cart : applyOptimisticAction(cart, action)
  );

  const [isAddingItem, startAdding] = useTransition();
  const [isUpdatingItem, startUpdating] = useTransition();
  const [isRemovingItem, startRemoving] = useTransition();

  const transitions = { add: startAdding, remove: startRemoving, update: startUpdating };

  const mutate = (
    seededCart: Cart | null,
    optimisticAction: OptimisticCartAction,
    mutation: () => Promise<Cart | null>
  ) => {
    if (confirmedCart === undefined) {
      setConfirmedCart(seededCart);
    }

    const start = transitions[optimisticAction.type];

    return new Promise<void>((resolve, reject) => {
      start(async () => {
        applyOptimistic(optimisticAction);

        try {
          const cart = await mutation();
          start(() => setConfirmedCart(cart));
          resolve();
        } catch (error) {
          const cart = await retrieveCart().catch(() => null);
          start(() => setConfirmedCart(cart));
          reject(error);
        }
      });
    });
  };

  const addToCart: CartContextValue['addToCart'] = (
    seededCart,
    { offerId, optimisticItem, quantity, countryCode }
  ) =>
    mutate(
      seededCart,
      {
        currencyCode: optimisticItem?.currencyCode || seededCart?.currency_code || '',
        item: optimisticItem?.item,
        type: 'add'
      },
      () => apiAddToCart({ countryCode, offerId, quantity })
    );

  const updateCartItem: CartContextValue['updateCartItem'] = (seededCart, lineId, quantity) =>
    mutate(seededCart, { lineId, quantity, type: 'update' }, () =>
      apiUpdateLineItem({ lineId, quantity })
    );

  const removeCartItem: CartContextValue['removeCartItem'] = (seededCart, lineId) =>
    mutate(seededCart, { lineId, type: 'remove' }, () => apiDeleteLineItem(lineId));

  return (
    <CartContext.Provider
      value={{
        addToCart,
        cartPromise: seed,
        isAddingItem,
        isRemovingItem,
        isUpdatingItem,
        optimisticCart,
        removeCartItem,
        updateCartItem
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
