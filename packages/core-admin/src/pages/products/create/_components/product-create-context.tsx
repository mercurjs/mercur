import { HttpTypes } from "@medusajs/types"
import { ProgressStatus } from "@medusajs/ui"
import { createContext, useContext, ReactNode } from "react"
import { UseFormReturn } from "react-hook-form"

import { ProductCreateSchemaType } from "./types"

export enum ProductCreateTab {
  DETAILS = "details",
  ORGANIZE = "organize",
  VARIANTS = "variants",
  INVENTORY = "inventory",
}

export type ProductCreateTabState = Record<ProductCreateTab, ProgressStatus>

export interface ProductCreateContextValue {
  // Dependencies (fetched by Root)
  store: HttpTypes.AdminStore
  regions: HttpTypes.AdminRegion[]
  pricePreferences: HttpTypes.AdminPricePreference[]
  defaultChannel: HttpTypes.AdminSalesChannel | undefined

  // Form state (set by Form sub-component)
  form: UseFormReturn<ProductCreateSchemaType>
  tab: ProductCreateTab
  setTab: (tab: ProductCreateTab) => void
  tabState: ProductCreateTabState
  onNext: (currentTab: ProductCreateTab) => Promise<void>
  handleSubmit: () => void
  isPending: boolean
  showInventoryTab: boolean
}

const ProductCreateContext = createContext<ProductCreateContextValue | null>(null)

export function useProductCreateContext() {
  const context = useContext(ProductCreateContext)
  if (!context) {
    throw new Error(
      "useProductCreateContext must be used within ProductCreatePage"
    )
  }
  return context
}

export function ProductCreateProvider({
  children,
  value,
}: {
  children: ReactNode
  value: ProductCreateContextValue
}) {
  return (
    <ProductCreateContext.Provider value={value}>
      {children}
    </ProductCreateContext.Provider>
  )
}
