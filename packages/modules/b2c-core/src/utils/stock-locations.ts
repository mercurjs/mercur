import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { Knex } from "@mikro-orm/postgresql"

import sellerStockLocation from "../links/seller-stock-location"

export type StockLocationManagedBy = "vendor" | "admin" | "both" | "none"

async function getVariantIdToLocationIdsMap(
  scope: any,
  variantIds: string[]
): Promise<Map<string, string[]>> {
  const ids = [...new Set(variantIds)].filter(
    (id) => typeof id === "string" && id.length > 0
  )

  if (!ids.length) {
    return new Map()
  }

  const knex = scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as Knex

  const rows = await knex("product_variant_inventory_item as pvii")
    .distinct("pvii.variant_id as variant_id", "il.location_id as location_id")
    .innerJoin(
      "inventory_level as il",
      "il.inventory_item_id",
      "pvii.inventory_item_id"
    )
    .whereIn("pvii.variant_id", ids)
    .whereNull("pvii.deleted_at")
    .whereNotNull("il.location_id")

  const map = new Map<string, Set<string>>()
  for (const r of rows ?? []) {
    const variantId = r?.variant_id
    const locationId = r?.location_id
    if (
      typeof variantId !== "string" ||
      !variantId ||
      typeof locationId !== "string" ||
      !locationId
    ) {
      continue
    }

    if (!map.has(variantId)) {
      map.set(variantId, new Set())
    }
    map.get(variantId)!.add(locationId)
  }

  const result = new Map<string, string[]>()
  for (const vid of ids) {
    result.set(vid, [...(map.get(vid) ?? new Set())])
  }

  return result
}

export async function getSellerLinkedStockLocationIdSet(
  scope: any,
  stockLocationIds: string[]
): Promise<Set<string>> {
  const ids = [...new Set(stockLocationIds)].filter(
    (id) => typeof id === "string" && id.length > 0
  )

  if (!ids.length) {
    return new Set()
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: links } = await query.graph({
    entity: sellerStockLocation.entryPoint,
    fields: ["stock_location_id"],
    filters: { stock_location_id: ids },
  })

  return new Set(
    (links ?? [])
      .map((l: any) => l?.stock_location_id)
      .filter((id: any) => typeof id === "string" && id.length > 0)
  )
}

function computeManagedByForLocationIds(
  locationIds: string[],
  vendorLocationIdSet: Set<string>
): StockLocationManagedBy {
  // vendor = linked to ANY seller (via seller-stock-location link)
  // admin  = NOT linked to any seller
  if (!Array.isArray(locationIds) || locationIds.length === 0) {
    return "none"
  }

  let hasVendor = false
  let hasAdmin = false

  for (const locId of locationIds) {
    if (vendorLocationIdSet.has(locId)) {
      hasVendor = true
    } else {
      hasAdmin = true
    }
    if (hasVendor && hasAdmin) {
      return "both"
    }
  }

  if (hasVendor) {
    return "vendor"
  }

  // Only admin-owned locations.
  return "admin"
}

export async function getVariantIdToHasAdminStockLocationMap(
  scope: any,
  variantIds: string[]
): Promise<Map<string, boolean>> {
  const ids = [...new Set(variantIds)].filter(
    (id) => typeof id === "string" && id.length > 0
  )

  if (!ids.length) {
    return new Map()
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const variantIdToLocationIds = await getVariantIdToLocationIdsMap(scope, ids)
  const allLocationIds = [
    ...new Set(
      [...variantIdToLocationIds.values()].flat().filter(Boolean)
    ),
  ]

  const sellerLinkedLocationIdSet =
    await getSellerLinkedStockLocationIdSet(scope, allLocationIds)

  const result = new Map<string, boolean>()
  for (const vid of ids) {
    const locationIds = variantIdToLocationIds.get(vid) ?? []
    const hasAdminStockLocation = locationIds.some(
      (locId) => !sellerLinkedLocationIdSet.has(locId)
    )
    result.set(vid, hasAdminStockLocation)
  }

  return result
}

export async function getVariantIdToManagedByMap(
  scope: any,
  variantIds: string[]
): Promise<Map<string, StockLocationManagedBy>> {
  const ids = [...new Set(variantIds)].filter(
    (id) => typeof id === "string" && id.length > 0
  )

  if (!ids.length) {
    return new Map()
  }

  const variantIdToLocationIds = await getVariantIdToLocationIdsMap(scope, ids)
  const allLocationIds = [
    ...new Set(
      [...variantIdToLocationIds.values()].flat().filter(Boolean)
    ),
  ]

  const vendorLocationIdSet = await getSellerLinkedStockLocationIdSet(
    scope,
    allLocationIds
  )

  const result = new Map<string, StockLocationManagedBy>()
  for (const vid of ids) {
    const locationIds = variantIdToLocationIds.get(vid) ?? []
    result.set(vid, computeManagedByForLocationIds(locationIds, vendorLocationIdSet))
  }

  return result
}

export async function attachHasAdminStockLocationToVariants(
  scope: any,
  variants: any[],
  fieldName: string = "has_admin_stock_location"
): Promise<void> {
  if (!Array.isArray(variants) || variants.length === 0) {
    return
  }

  const variantIds = variants
    .map((v: any) => v?.id)
    .filter((id: any) => typeof id === "string" && id.length > 0)

  if (!variantIds.length) {
    return
  }

  const map = await getVariantIdToHasAdminStockLocationMap(scope, variantIds)

  for (const v of variants) {
    const vid = v?.id
    if (typeof vid === "string" && vid.length > 0) {
      v[fieldName] = map.get(vid) ?? false
    }
  }
}

export async function attachManagedByToVariants(
  scope: any,
  variants: any[],
  fieldName: string = "managed_by"
): Promise<void> {
  if (!Array.isArray(variants) || variants.length === 0) {
    return
  }

  const variantIds = variants
    .map((v: any) => v?.id)
    .filter((id: any) => typeof id === "string" && id.length > 0)

  if (!variantIds.length) {
    return
  }

  const map = await getVariantIdToManagedByMap(scope, variantIds)

  for (const v of variants) {
    const vid = v?.id
    if (typeof vid === "string" && vid.length > 0) {
      v[fieldName] = map.get(vid) ?? "none"
    }
  }
}

export async function attachHasAdminStockLocationToOrderItems(
  scope: any,
  items: any[],
  fieldName: string = "has_admin_stock_location"
): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) {
    return
  }

  const variantIds = items
    .map((i: any) => i?.variant?.id ?? i?.variant_id)
    .filter((id: any) => typeof id === "string" && id.length > 0)

  if (!variantIds.length) {
    return
  }

  const map = await getVariantIdToHasAdminStockLocationMap(scope, variantIds)

  for (const item of items) {
    const vid = item?.variant?.id ?? item?.variant_id
    if (typeof vid !== "string" || !vid) {
      continue
    }

    const value = map.get(vid) ?? false
    // keep a convenient top-level flag too
    item.variant_has_admin_stock_location = value

    if (item?.variant && typeof item.variant === "object") {
      item.variant[fieldName] = value
    }
  }
}

export async function attachManagedByToOrderItems(
  scope: any,
  items: any[],
  fieldName: string = "managed_by"
): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) {
    return
  }

  const variantIds = items
    .map((i: any) => i?.variant?.id ?? i?.variant_id)
    .filter((id: any) => typeof id === "string" && id.length > 0)

  if (!variantIds.length) {
    return
  }

  const map = await getVariantIdToManagedByMap(scope, variantIds)

  for (const item of items) {
    const vid = item?.variant?.id ?? item?.variant_id
    if (typeof vid !== "string" || !vid) {
      continue
    }

    const value = map.get(vid) ?? "none"
    // keep a convenient top-level field too
    item.variant_managed_by = value

    if (item?.variant && typeof item.variant === "object") {
      item.variant[fieldName] = value
    }
  }
}

export async function attachStockLocationOwnerToFulfillments(
  scope: any,
  fulfillments: any[]
): Promise<void> {
  if (!Array.isArray(fulfillments) || fulfillments.length === 0) {
    return
  }

  const locationIds = [
    ...new Set(
      fulfillments
        .map((f: any) => f?.location_id)
        .filter((id: any) => typeof id === "string" && id.length > 0)
    ),
  ]

  if (!locationIds.length) {
    return
  }

  const vendorLocationIdSet = await getSellerLinkedStockLocationIdSet(
    scope,
    locationIds
  )

  for (const f of fulfillments) {
    const locationId = f?.location_id
    if (typeof locationId === "string" && locationId.length > 0) {
      f.stock_location_owner = vendorLocationIdSet.has(locationId)
        ? "vendor"
        : "admin"
    }
  }
}


