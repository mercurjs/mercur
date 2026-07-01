"use client"

import { CartProvider } from "@/components/providers"
import type React from "react"

import { PropsWithChildren } from "react"

export function Providers({ children }: PropsWithChildren) {
  return <CartProvider>{children}</CartProvider>
}
