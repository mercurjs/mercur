import { createContext, useContext, ReactNode } from "react"

import type { AdminProductListResponse } from "@medusajs/types"
import type { AdminCustomerGroupListResponse } from "@custom-types/customer-group"
import type { AdminOrderListResponse } from "@custom-types/order"
import type { VendorSeller } from "@custom-types/seller"

export interface SellerDetailContextValue {
  seller: VendorSeller
  orders: AdminOrderListResponse | undefined
  products: AdminProductListResponse | undefined
  customerGroups: AdminCustomerGroupListResponse | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetchProducts: () => void
  refetchCustomerGroups: () => void
}

const SellerDetailContext = createContext<SellerDetailContextValue | null>(null)

export function useSellerDetailContext() {
  const context = useContext(SellerDetailContext)
  if (!context) {
    throw new Error("useSellerDetailContext must be used within SellerDetailPage")
  }
  return context
}

export function SellerDetailProvider({
  children,
  value,
}: {
  children: ReactNode
  value: SellerDetailContextValue
}) {
  return (
    <SellerDetailContext.Provider value={value}>
      {children}
    </SellerDetailContext.Provider>
  )
}
