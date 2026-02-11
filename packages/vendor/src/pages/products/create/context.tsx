import { createContext, useContext } from "react"
import { UseFormReturn } from "react-hook-form"
import { HttpTypes } from "@medusajs/types"

export interface ProductCreateFormValues {
  title: string
  subtitle?: string
  handle?: string
  description?: string
  discountable?: boolean
  type_id?: string
  collection_id?: string
  categories: string[]
  tags?: string[]
  sales_channels?: { id: string; name: string }[]
  options: { title: string; values: string[] }[]
  variants: Record<string, any>[]
  media?: any[]
  enable_variants?: boolean
  width?: string
  length?: string
  height?: string
  weight?: string
  mid_code?: string
  hs_code?: string
  origin_country?: string
  [key: string]: any
}

export interface ProductCreateContextValue {
  form: UseFormReturn<ProductCreateFormValues>
  store?: HttpTypes.AdminStore
  defaultChannel?: HttpTypes.AdminSalesChannel
  regions?: HttpTypes.AdminRegion[]
  pricePreferences?: HttpTypes.AdminPricePreference[]
}

const ProductCreateContext = createContext<ProductCreateContextValue | null>(
  null
)

export const useProductCreateContext = () => {
  const context = useContext(ProductCreateContext)
  if (!context) {
    throw new Error(
      "useProductCreateContext must be used within a ProductCreatePage"
    )
  }
  return context
}

export const ProductCreateProvider = ProductCreateContext.Provider
