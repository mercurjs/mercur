import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export type ProductVariantDetailData = HttpTypes.AdminProductVariant

export interface ProductVariantDetailContextValue {
  variant: ProductVariantDetailData
}

const ProductVariantDetailContext =
  createContext<ProductVariantDetailContextValue | null>(null)

export const useProductVariantDetailContext = () => {
  const context = useContext(ProductVariantDetailContext)
  if (!context) {
    throw new Error(
      "useProductVariantDetailContext must be used within a ProductVariantDetailPage"
    )
  }
  return context
}

export const ProductVariantDetailProvider = ({
  variant,
  children,
}: {
  variant: ProductVariantDetailData
  children: ReactNode
}) => {
  return (
    <ProductVariantDetailContext.Provider value={{ variant }}>
      {children}
    </ProductVariantDetailContext.Provider>
  )
}
