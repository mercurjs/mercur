import { HttpTypes } from "@medusajs/types"
import { useQueryParams } from "../../use-query-params"

type UsePromotionTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const usePromotionTableQuery = ({
  prefix,
  pageSize = 20,
}: UsePromotionTableQueryProps) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "q",
      "order",
      "created_at",
      "updated_at",
      "campaign_id",
      "is_automatic",
      "application_method_type",
      "seller_id",
    ],
    prefix
  )

  const {
    offset,
    q,
    order,
    created_at,
    updated_at,
    campaign_id,
    is_automatic,
    application_method_type,
    seller_id,
  } = queryObject

  const searchParams: HttpTypes.AdminGetPromotionsParams & {
    is_automatic?: boolean
    campaign_id?: string
    application_method?: { type?: string }
    seller_id?: string
  } = {
    limit: pageSize,
    fields: "+seller.id,+seller.name",
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    campaign_id: campaign_id || undefined,
    seller_id: seller_id || undefined,
    is_automatic: is_automatic ? is_automatic === "true" : undefined,
    application_method: application_method_type
      ? { type: application_method_type }
      : undefined,
    offset: offset ? Number(offset) : 0,
    order: order || "-created_at",
    q,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
