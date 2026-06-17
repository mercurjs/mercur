import { HttpTypes } from "@medusajs/types"
import { useQueryParams } from "../../use-query-params"

type UseCustomerGroupTableQueryProps = {
  prefix?: string
  pageSize?: number
}

// `seller_id` (the owning seller) is a Mercur link filter and isn't part of
// Medusa's base customer-group filter type.
type ExtendedAdminCustomerGroupFilters =
  HttpTypes.AdminGetCustomerGroupsParams & {
    seller_id?: string[]
  }

export const useCustomerGroupTableQuery = ({
  prefix,
  pageSize = 20,
}: UseCustomerGroupTableQueryProps) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "q",
      "has_account",
      "order",
      "created_at",
      "updated_at",
      "seller_id",
    ],
    prefix
  )

  const { offset, created_at, updated_at, q, order, seller_id } = queryObject

  const searchParams: ExtendedAdminCustomerGroupFilters = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    seller_id: seller_id?.split(","),
    q,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
