import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface CustomerDetailContextValue {
  customer: HttpTypes.AdminCustomer
}

const CustomerDetailContext =
  createContext<CustomerDetailContextValue | null>(null)

export const useCustomerDetailContext = () => {
  const context = useContext(CustomerDetailContext)
  if (!context) {
    throw new Error(
      "useCustomerDetailContext must be used within a CustomerDetailPage"
    )
  }
  return context
}

export const CustomerDetailProvider = ({
  customer,
  children,
}: {
  customer: HttpTypes.AdminCustomer
  children: ReactNode
}) => {
  return (
    <CustomerDetailContext.Provider value={{ customer }}>
      {children}
    </CustomerDetailContext.Provider>
  )
}
