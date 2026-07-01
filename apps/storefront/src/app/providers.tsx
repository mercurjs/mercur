"use client"

import { CartProvider } from "@/components/providers"
import { Cart } from "@/types/cart"
import type React from "react"

import { PropsWithChildren } from "react"

interface ProvidersProps extends PropsWithChildren {
  cart: Cart | null
}

export function Providers({ children, cart }: ProvidersProps) {
  return <CartProvider cart={cart}>{children}</CartProvider>
}
