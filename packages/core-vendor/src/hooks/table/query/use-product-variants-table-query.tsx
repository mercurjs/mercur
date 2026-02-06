import { useQueryParams } from "../../use-query-params"

type UseProductVariantsTableQueryProps = {
  prefix?: string
  pageSize?: number
}

const DEFAULT_FIELDS =
  "*options,*inventory_items,*inventory_items.inventory,*inventory_items.inventory.location_levels"

export const useProductVariantsTableQuery = ({
  prefix,
  pageSize = 10,
}: UseProductVariantsTableQueryProps) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "order",
      "q",
      "id",
      "sku",
      "title",
      "manage_inventory",
      "allow_backorder",
      "created_at",
      "updated_at",
    ],
    prefix
  )

  const {
    offset,
    order,
    q,
    id,
    sku,
    title,
    manage_inventory,
    allow_backorder,
    created_at,
    updated_at,
  } = queryObject

  const searchParams: {
    limit: number
    offset: number
    fields: string
    order?: string
    q?: string
    id?: string | string[]
    sku?: string | string[]
    title?: string | string[]
    manage_inventory?: boolean
    allow_backorder?: boolean
    created_at?: any
    updated_at?: any
  } = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    fields: DEFAULT_FIELDS,
    order: order,
    q: q,
    id: id ? id.split(",") : undefined,
    sku: sku ? sku.split(",") : undefined,
    title: title ? title.split(",") : undefined,
    manage_inventory: manage_inventory ? manage_inventory === "true" : undefined,
    allow_backorder: allow_backorder ? allow_backorder === "true" : undefined,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
