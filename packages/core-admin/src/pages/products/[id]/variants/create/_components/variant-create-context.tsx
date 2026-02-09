import { HttpTypes } from "@medusajs/types"
import { ProgressStatus } from "@medusajs/ui"
import { createContext, useContext, ReactNode } from "react"
import { UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { CreateProductVariantSchema } from "./create-product-variant-form/constants"

export enum VariantCreateTab {
  DETAIL = "detail",
  PRICE = "price",
  INVENTORY = "inventory",
}

export type VariantCreateTabState = Record<VariantCreateTab, ProgressStatus>

export interface VariantCreateContextValue {
  product: HttpTypes.AdminProduct
  form: UseFormReturn<z.infer<typeof CreateProductVariantSchema>>
  tab: VariantCreateTab
  setTab: (tab: VariantCreateTab) => void
  tabState: VariantCreateTabState
  handleNextTab: (tab: VariantCreateTab) => void
  handleSubmit: () => void
  isPending: boolean
  inventoryTabEnabled: boolean
}

const VariantCreateContext = createContext<VariantCreateContextValue | null>(
  null
)

export function useVariantCreateContext() {
  const context = useContext(VariantCreateContext)
  if (!context) {
    throw new Error(
      "useVariantCreateContext must be used within VariantCreateModal"
    )
  }
  return context
}

export function VariantCreateProvider({
  children,
  value,
}: {
  children: ReactNode
  value: VariantCreateContextValue
}) {
  return (
    <VariantCreateContext.Provider value={value}>
      {children}
    </VariantCreateContext.Provider>
  )
}
