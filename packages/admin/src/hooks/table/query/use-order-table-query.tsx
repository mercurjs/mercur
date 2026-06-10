import { useQueryParams } from "@hooks/use-query-params"
import type { HttpTypes } from "@medusajs/types"

type UseOrderTableQueryProps = {
  prefix?: string
  pageSize?: number
}

type ExtendedAdminOrderFilters = HttpTypes.AdminOrderFilters & {
  fulfillment_status?: string[]
  payment_status?: string[]
  customer_id?: string[]
  seller_id?: string[]
  status?: string[]
}

export const useOrderTableQuery = ({
  prefix,
  pageSize = 20,
}: UseOrderTableQueryProps) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "q",
      "created_at",
      "updated_at",
      "region_id",
      "sales_channel_id",
      "customer_id",
      "seller_id",
      "status",
      "payment_status",
      "fulfillment_status",
      "order",
    ],
    prefix
  )

  const {
    offset,
    sales_channel_id,
    customer_id,
    seller_id,
    status,
    created_at,
    updated_at,
    fulfillment_status,
    payment_status,
    region_id,
    q,
    order,
  } = queryObject

  const searchParams: ExtendedAdminOrderFilters = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    sales_channel_id: sales_channel_id?.split(","),
    customer_id: customer_id?.split(","),
    seller_id: seller_id?.split(","),
    status: status?.split(","),
    fulfillment_status: fulfillment_status?.split(","),
    payment_status: payment_status?.split(","),
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    region_id: region_id?.split(","),
    order: order ? order : "-display_id",
    q,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
