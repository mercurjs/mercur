import { AdminOrderLineItem, AdminRegion, HttpTypes } from "@medusajs/types"

export type OrderPaymentStatus =
  | "pending"
  | "captured"
  | "partially_refunded"
  | "refunded"

export type ExtendedPaymentCollectionStatus =
  | "not_paid"
  | "awaiting"
  | "authorized"
  | "partially_authorized"
  | "captured"
  | "partially_captured"
  | "partially_refunded"
  | "refunded"
  | "canceled"
  | "completed"
  | "failed"
  | "requires_action"

export interface OrderCommission {
  commission_value: {
    amount: number
    currency_code: string
  }
}

export interface ExtendedAdminPaymentCollection {
  id: string
  amount: number
  currency_code: string
  authorized_amount: number
  captured_amount: number
  refunded_amount: number
  status: ExtendedPaymentCollectionStatus
}

export interface ExtendedAdminOrderResponse {
  order: ExtendedAdminOrder
}

export type ExtendedAdminOrder = Omit<HttpTypes.AdminOrder, "items" | "fulfillments"> & {
  canceled_at?: string | null
  returns?: any[]
  discount_subtotal: number
  items: ExtendedAdminOrderLineItemWithInventory[]
  fulfillments?: ExtendedAdminOrderFulfillment[]
  split_order_payment?: {
    id: string
    status: ExtendedPaymentCollectionStatus
    currency_code: string
    payment_collection_id: string
    raw_authorized_amount: {
      value: string
      precision: number
    }
    raw_captured_amount: {
      value: string
      precision: number
    }
    raw_refunded_amount: {
      value: string
      precision: number
    }
    created_at: string
    updated_at: string
    deleted_at: string | null
    authorized_amount: number
    captured_amount: number
    refunded_amount: number
  } | null
  region?: HttpTypes.AdminRegion
}

export interface ExtendedAdminOrderFulfillment
  extends HttpTypes.AdminOrderFulfillment {
  items?: (AdminOrderLineItem & { line_item_id: string })[]
  labels?: {
    id: string
    tracking_number: string
    tracking_url: string
    label_url: string
    fulfillment_id: string
    created_at: string
    updated_at: string
    deleted_at: string | null
  }[]
  shipping_option?: {
    id: string
    name?: string
    service_zone_id: string
    service_zone: {
      id: string
      fulfillment_set_id: string
      fulfillment_set: {
        id: string
        type: string
      }
    }
  }
}

export interface ExtendedAdminOrderChange extends HttpTypes.AdminOrderChange {
  created_by?: string | null
}
export interface OrderCommission {
  commission: {
    commission_value: {
      amount: string
      currency_code: string
    }
  }
}

export type ExtendedAdminProductVariant = Omit<
  HttpTypes.AdminProductVariant,
  "inventory_items"
> & {
  inventory?: ExtendedAdminProductVariantInventory[]
  inventory_items?: {
    id: string
    required_quantity: number
    inventory_item_id: string
    variant_id: string
  }[]
}

export type ExtendedAdminOrderLineItemWithInventory = Omit<
  HttpTypes.AdminOrderLineItem,
  "variant"
> & {
  variant?: ExtendedAdminProductVariant
}

export type ExtendedAdminProductVariantInventory = {
  id: string
  title?: string | null
  sku?: string | null
  location_levels?: {
    location_id: string
    available_quantity: number
    stocked_quantity: number
  }[]
}