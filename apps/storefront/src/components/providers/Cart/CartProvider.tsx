'use client';

import { PropsWithChildren, useOptimistic, useState, useTransition } from 'react';

import {
  addToCart as apiAddToCart,
  deleteLineItem as apiDeleteLineItem,
  updateLineItem as apiUpdateLineItem,
  retrieveCart
} from '@/lib/data/cart';
import { Cart, StoreCartLineItemOptimisticUpdate } from '@/types/cart';

import { CartContext, type CartContextValue, getOfferPendingKey } from './context';
import { CartDrawerProvider } from './drawer';

interface CartProviderProps extends PropsWithChildren {
  cartPromise: Promise<Cart | null>;
}

type OptimisticCartAction =
  | { type: 'add'; item?: StoreCartLineItemOptimisticUpdate; currencyCode: string }
  | { type: 'update'; lineId: string; quantity: number }
  | { type: 'remove'; lineId: string };

type LineItem = StoreCartLineItemOptimisticUpdate;

function getItemsSummaryValues(items: LineItem[]) {
  return items.reduce<{ item_subtotal: number; total: number; tax_total: number }>(
    (acc, item) => ({
      item_subtotal: acc.item_subtotal + (item.subtotal || 0),
      total: acc.total + (item.total || 0),
      tax_total: acc.tax_total + (item.tax_total || 0)
    }),
    { item_subtotal: 0, total: 0, tax_total: 0 }
  );
}

function scaleLine(item: LineItem, quantity: number): LineItem {
  const current = item.quantity || 0;
  const ratio = current > 0 ? quantity / current : 0;
  return {
    ...item,
    quantity,
    subtotal: (item.subtotal || 0) * ratio,
    total: (item.total || 0) * ratio,
    tax_total: (item.tax_total || 0) * ratio
  };
}

function withItems(cart: Cart | null, items: LineItem[], currencyCode?: string): Cart {
  return {
    ...cart,
    ...getItemsSummaryValues(items),
    items,
    ...(currencyCode ? { currency_code: currencyCode } : {})
  } as Cart;
}

function applyOptimisticAction(cart: Cart | null, action: OptimisticCartAction): Cart | null {
  const currentItems = (cart?.items || []) as LineItem[];

  if (action.type === 'update') {
    return withItems(
      cart,
      currentItems.map(item => (item.id === action.lineId ? scaleLine(item, action.quantity) : item))
    );
  }

  if (action.type === 'remove') {
    return withItems(
      cart,
      currentItems.filter(item => item.id !== action.lineId)
    );
  }

  const { item: newItem, currencyCode } = action;
  if (!newItem) return cart;

  const offerId = newItem.metadata?.offer_id;
  const existing = currentItems.find(item => item.metadata?.offer_id === offerId);

  const items = existing
    ? currentItems.map(item =>
        item === existing
          ? scaleLine(item, (item.quantity || 0) + (newItem.quantity || 0))
          : item
      )
    : [...currentItems, { ...newItem, id: `optimistic:${offerId}` }];

  return withItems(cart, items, currencyCode);
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

  const [pendingKeys, markPending] = useOptimistic<string[], string>([], (keys, key) => [
    ...keys,
    key
  ]);

  const [isAddingItem, startAdding] = useTransition();
  const [isUpdatingItem, startUpdating] = useTransition();
  const [isRemovingItem, startRemoving] = useTransition();

  const transitions = { add: startAdding, remove: startRemoving, update: startUpdating };

  const mutate = (
    seededCart: Cart | null,
    optimisticAction: OptimisticCartAction,
    pendingKey: string,
    mutation: () => Promise<Cart | null>
  ) => {
    if (confirmedCart === undefined) {
      setConfirmedCart(seededCart);
    }

    const start = transitions[optimisticAction.type];

    return new Promise<void>((resolve, reject) => {
      start(async () => {
        applyOptimistic(optimisticAction);
        markPending(pendingKey);

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
      getOfferPendingKey(offerId),
      () => apiAddToCart({ countryCode, offerId, quantity })
    );

  const updateCartItem: CartContextValue['updateCartItem'] = (seededCart, lineId, quantity) =>
    mutate(seededCart, { lineId, quantity, type: 'update' }, lineId, () =>
      apiUpdateLineItem({ lineId, quantity })
    );

  const removeCartItem: CartContextValue['removeCartItem'] = (seededCart, lineId) =>
    mutate(seededCart, { lineId, type: 'remove' }, lineId, () => apiDeleteLineItem(lineId));

  return (
    <CartContext.Provider
      value={{
        addToCart,
        cartPromise: seed,
        isAddingItem,
        isRemovingItem,
        isUpdatingItem,
        optimisticCart,
        pendingKeys,
        removeCartItem,
        updateCartItem
      }}
    >
      <CartDrawerProvider>{children}</CartDrawerProvider>
    </CartContext.Provider>
  );
}
