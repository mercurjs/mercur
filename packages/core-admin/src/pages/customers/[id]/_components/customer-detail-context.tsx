import { createContext, useContext, ReactNode } from "react"
import { HttpTypes } from "@medusajs/types"

export interface CustomerDetailContextValue {
  customer: HttpTypes.AdminCustomer
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const CustomerDetailContext = createContext<CustomerDetailContextValue | null>(null)

export function useCustomerDetailContext() {
  const context = useContext(CustomerDetailContext)
  if (!context) {
    throw new Error("useCustomerDetailContext must be used within CustomerDetailPage")
  }
  return context
}

export function CustomerDetailProvider({
  children,
  value,
}: {
  children: ReactNode
  value: CustomerDetailContextValue
}) {
  return (
    <CustomerDetailContext.Provider value={value}>
      {children}
    </CustomerDetailContext.Provider>
  )
}
