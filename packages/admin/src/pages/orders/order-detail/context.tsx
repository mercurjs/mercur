import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface OrderDetailContextValue {
  order: HttpTypes.AdminOrder
  orderPreview: HttpTypes.AdminOrderPreview
}

const OrderDetailContext = createContext<OrderDetailContextValue | null>(null)

export const useOrderDetailContext = () => {
  const context = useContext(OrderDetailContext)
  if (!context) {
    throw new Error(
      "useOrderDetailContext must be used within an OrderDetailPage"
    )
  }
  return context
}

export const OrderDetailProvider = ({
  order,
  orderPreview,
  children,
}: {
  order: HttpTypes.AdminOrder
  orderPreview: HttpTypes.AdminOrderPreview
  children: ReactNode
}) => {
  return (
    <OrderDetailContext.Provider value={{ order, orderPreview }}>
      {children}
    </OrderDetailContext.Provider>
  )
}
