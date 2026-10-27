"use client"

import { Badge } from "@/components/atoms"
import { useCartContext } from "@/components/providers"
import { useCartDrawer } from "@/components/providers/Cart/drawer"
import { CartIcon } from "@/icons"

export const CartButton = () => {
  const { cart } = useCartContext()
  const { openDrawer } = useCartDrawer()

  const count = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="relative flex cursor-pointer items-center justify-center"
      aria-label="Open cart"
      data-testid="header-cart-button"
    >
      <CartIcon size={20} />
      {count > 0 && (
        <Badge className="absolute -top-2 -right-2 w-4 h-4 p-0" data-testid="header-cart-count">
          {count}
        </Badge>
      )}
    </button>
  )
}
