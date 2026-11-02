"use client"

import { Suspense } from "react"
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

import { Button } from '@/components/atoms/Button/Button';
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { DeleteCartItemButton } from "@/components/molecules/DeleteCartItemButton/DeleteCartItemButton"
import { UpdateCartItemButton } from "@/components/molecules/UpdateCartItemButton/UpdateCartItemButton"
import { useCartContext } from "@/components/providers"
import { useCartDrawer } from "@/components/providers/Cart/drawer"
import { CloseIcon } from "@/icons"
import Spinner from "@/icons/spinner"
import { filterValidCartItems } from "@/lib/helpers/filter-valid-cart-items"
import { convertToLocale } from "@/lib/helpers/money"

type CartLine = HttpTypes.StoreCartLineItem & {
  offer?: { seller?: { name?: string } | null } | null
}

export const CartDrawer = () => {
  const { closeDrawer, isDrawerOpen } = useCartDrawer()

  return (
    <Dialog open={isDrawerOpen} onClose={closeDrawer} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/20 transition-opacity duration-200 ease-out data-[closed]:opacity-0"
      />
      <div className="fixed inset-y-0 right-0 flex w-full max-w-md">
        <DialogPanel
          transition
          className="flex h-full w-full flex-col bg-primary shadow-lg transition-transform duration-300 ease-out data-[closed]:translate-x-full"
          data-testid="cart-drawer"
        >
          <div className="flex items-center justify-between border-b px-4 py-4">
            <DialogTitle className="heading-md uppercase">Cart</DialogTitle>
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close cart"
              className="flex h-8 w-8 cursor-pointer items-center justify-center"
              data-testid="cart-drawer-close"
            >
              <CloseIcon size={20} />
            </button>
          </div>
          <Suspense
            fallback={
              <div
                aria-busy="true"
                className="flex flex-1 items-center justify-center gap-2 label-md text-secondary"
                role="status"
              >
                <Spinner /> Loading cart…
              </div>
            }
          >
            <CartDrawerContent />
          </Suspense>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

const CartDrawerContent = () => {
  const { cart, isUpdating } = useCartContext()
  const { closeDrawer } = useCartDrawer()

  const items = filterValidCartItems(cart?.items) as CartLine[]
  const currencyCode = cart?.currency_code || "eur"

  if (!items.length) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center"
        data-testid="cart-drawer-empty"
      >
        <h3 className="heading-md uppercase">Your cart is empty</h3>
        <LocalizedClientLink href="/categories" onClick={closeDrawer}>
          <Button className="px-8 py-3" data-testid="cart-drawer-continue-shopping">
            Continue shopping
          </Button>
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
        data-testid="cart-drawer-items"
      >
        {items.map((item) => (
          <CartDrawerLine
            key={item.id}
            item={item}
            currencyCode={currencyCode}
            onNavigate={closeDrawer}
          />
        ))}
      </ul>
      <footer className="flex flex-col gap-4 border-t px-4 py-4">
        <div aria-busy={isUpdating || undefined} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between">
            <span className="label-lg">Subtotal</span>
            {isUpdating ? (
              <span className="label-lg text-secondary" data-testid="cart-drawer-total-updating">
                Updating…
              </span>
            ) : (
              <span className="heading-sm" data-testid="cart-drawer-total">
                {convertToLocale({
                  amount: cart?.item_subtotal || 0,
                  currency_code: currencyCode,
                })}
              </span>
            )}
          </div>
          <p className="label-sm text-secondary">
            Taxes and shipping calculated at checkout.
          </p>
        </div>
        {isUpdating ? (
          <Button className="w-full py-3" disabled data-testid="cart-drawer-checkout">
            Go to checkout
          </Button>
        ) : (
          <LocalizedClientLink href="/checkout?step=address" onClick={closeDrawer}>
            <Button className="w-full py-3" data-testid="cart-drawer-checkout">
              Go to checkout
            </Button>
          </LocalizedClientLink>
        )}
        <LocalizedClientLink
          href="/cart"
          onClick={closeDrawer}
          className="label-md text-center underline"
          data-testid="cart-drawer-view-cart"
        >
          View cart
        </LocalizedClientLink>
      </footer>
    </div>
  )
}

const CartDrawerLine = ({
  item,
  currencyCode,
  onNavigate,
}: {
  item: CartLine
  currencyCode: string
  onNavigate: () => void
}) => {
  const { isLinePending } = useCartContext()
  const isPending = isLinePending(item)
  const href = item.product_handle ? `/products/${item.product_handle}` : undefined
  const options = Object.entries(item.variant_option_values ?? {})
  const sellerName = item.offer?.seller?.name

  const thumbnail = item.thumbnail ? (
    <Image
      src={decodeURIComponent(item.thumbnail)}
      alt={item.product_title || "Product"}
      fill
      sizes="80px"
      className="object-cover"
    />
  ) : (
    <Image
      src="/images/placeholder.svg"
      alt=""
      fill
      sizes="80px"
      className="object-contain p-4 opacity-30"
    />
  )

  return (
    <li
      className="flex gap-3"
      aria-busy={isPending || undefined}
      data-testid="cart-drawer-item"
    >
      {href ? (
        <LocalizedClientLink
          href={href}
          onClick={onNavigate}
          className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xs border"
        >
          {thumbnail}
        </LocalizedClientLink>
      ) : (
        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xs border">
          {thumbnail}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="heading-xs truncate uppercase">{item.product_title}</h3>
            <div className="label-sm text-secondary">
              {options.map(([title, value]) => (
                <p key={title}>
                  {title}: <span className="text-primary">{String(value)}</span>
                </p>
              ))}
              {sellerName && <p>Sold by {sellerName}</p>}
            </div>
          </div>
          <span
            className="label-lg shrink-0 tabular-nums data-[pending=true]:text-secondary"
            data-pending={isPending}
            data-testid="cart-drawer-item-price"
          >
            {convertToLocale({ amount: item.subtotal ?? 0, currency_code: currencyCode })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <UpdateCartItemButton quantity={item.quantity} lineItemId={item.id} compact />
          <DeleteCartItemButton id={item.id} />
        </div>
      </div>
    </li>
  )
}
