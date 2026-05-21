import { useQueryParams } from "../../../hooks/use-query-params"

export const useOfferTableQuery = ({
  pageSize = 20,
  prefix,
}: {
  pageSize?: number
  prefix?: string
}) => {
  const raw = useQueryParams(
    [
      "q",
      "order",
      "offset",
      "sku",
      "shipping_profile_id",
      "variant_id",
      "created_at",
      "updated_at",
    ],
    prefix,
  )

  const { offset, created_at, updated_at, shipping_profile_id, variant_id, ...rest } = raw

  const searchParams: Record<string, unknown> = {
    limit: pageSize,
    offset: offset ? parseInt(offset, 10) : undefined,
    order: rest.order ?? "-updated_at",
    q: rest.q,
    sku: rest.sku,
    shipping_profile_id: shipping_profile_id
      ? shipping_profile_id.split(",")
      : undefined,
    variant_id: variant_id ? variant_id.split(",") : undefined,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
  }

  return {
    searchParams,
    raw,
  }
}
