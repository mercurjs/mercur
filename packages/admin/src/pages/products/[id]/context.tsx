import { createContext, useContext, ReactNode } from "react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProductDetailData = Record<string, any>

export interface ProductDetailContextValue {
  product: ProductDetailData
}

const ProductDetailContext = createContext<ProductDetailContextValue | null>(
  null
)

export const useProductDetailContext = () => {
  const context = useContext(ProductDetailContext)
  if (!context) {
    throw new Error(
      "useProductDetailContext must be used within a ProductDetailPage"
    )
  }
  return context
}

export const ProductDetailProvider = ({
  product,
  children,
}: {
  product: ProductDetailData
  children: ReactNode
}) => {
  return (
    <ProductDetailContext.Provider value={{ product }}>
      {children}
    </ProductDetailContext.Provider>
  )
}
