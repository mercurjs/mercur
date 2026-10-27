"use client"

import { CartDrawer } from "@/components/cells/CartDrawer/CartDrawer"
import { CartProvider } from "@/components/providers"
import { Cart } from "@/types/cart"
import type React from "react"

import { PropsWithChildren } from "react"

interface ProvidersProps extends PropsWithChildren {
  cartPromise: Promise<Cart | null>
}

export function Providers({ children, cartPromise }: ProvidersProps) {
  return (
    <CartProvider cartPromise={cartPromise}>
      {children}
      <CartDrawer />
    </CartProvider>
  )
}
