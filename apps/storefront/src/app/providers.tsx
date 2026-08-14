"use client"

import { CartProvider, ThemeProvider } from "@/components/providers"
import { Cart } from "@/types/cart"

import { PropsWithChildren } from "react"

interface ProvidersProps extends PropsWithChildren {
  cart: Cart | null
}

export function Providers({ children, cart }: ProvidersProps) {
  return (
    <ThemeProvider>
      <CartProvider cart={cart}>{children}</CartProvider>
    </ThemeProvider>
  )
}
