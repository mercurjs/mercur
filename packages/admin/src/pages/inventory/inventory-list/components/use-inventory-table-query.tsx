import { HttpTypes } from "@medusajs/types"

import { useQueryParams } from "../../../../hooks/use-query-params"

export const useInventoryTableQuery = ({
  pageSize = 20,
  prefix,
}: {
  pageSize?: number
  prefix?: string
}) => {
  const raw = useQueryParams(
    [
      "id",
      "location_id",
      "seller_id",
      "q",
      "order",
      "offset",
      "sku",
      "material",
      "mid_code",
      "hs_code",
      "width",
      "height",
    ],
    prefix
  )

  const { offset, width, height, ...params } = raw

  const searchParams: HttpTypes.AdminInventoryItemsParams & {
    seller_id?: string[]
  } = {
    limit: pageSize,
    offset: offset ? parseInt(offset) : undefined,
    width: width ? JSON.parse(width) : undefined,
    height: height ? JSON.parse(height) : undefined,
    q: params.q,
    sku: params.sku,
    order: params.order || "title",
    mid_code: params.mid_code,
    hs_code: params.hs_code,
    material: params.material,
    location_levels: {
      location_id: params.location_id || [],
    },
    seller_id: params.seller_id ? params.seller_id.split(",") : undefined,
    id: params.id ? params.id.split(",") : undefined,
  }

  return {
    searchParams,
    raw,
  }
}
