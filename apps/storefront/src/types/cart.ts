import { HttpTypes } from "@medusajs/types"

export interface Cart extends HttpTypes.StoreCart {
  promotions?: HttpTypes.StorePromotion[]
  discount_subtotal?: number
}

export interface StoreCartLineItemOptimisticUpdate
  extends Partial<HttpTypes.StoreCartLineItem> {
  tax_total: number
}
