import { MedusaContainer } from "@medusajs/framework"
import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

type LevelRef = { inventory_item_id: string; location_id: string }

const loadSellerIdsByKey = async (
  scope: MedusaContainer,
  entity: "inventory_item_seller" | "stock_location_seller",
  key: "inventory_item_id" | "stock_location_id",
  ids: string[]
) => {
  const map = new Map<string, string>()
  if (!ids.length) {
    return map
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: links } = await query.graph({
    entity,
    filters: { [key]: ids },
    fields: [key, "seller_id"],
  })

  for (const link of links as Array<Record<string, string>>) {
    map.set(link[key], link.seller_id)
  }

  return map
}

export const validateLevelsMatchItemSeller = async (
  scope: MedusaContainer,
  levels: LevelRef[]
) => {
  if (!levels.length) {
    return
  }

  const itemIds = Array.from(new Set(levels.map((l) => l.inventory_item_id)))
  const locationIds = Array.from(new Set(levels.map((l) => l.location_id)))

  const [itemSellers, locationSellers] = await Promise.all([
    loadSellerIdsByKey(scope, "inventory_item_seller", "inventory_item_id", itemIds),
    loadSellerIdsByKey(scope, "stock_location_seller", "stock_location_id", locationIds),
  ])

  for (const level of levels) {
    const itemSeller = itemSellers.get(level.inventory_item_id)
    if (!itemSeller) {
      continue
    }

    const locationSeller = locationSellers.get(level.location_id)
    if (locationSeller !== itemSeller) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Stock location with id: ${level.location_id} does not belong to the store that owns inventory item with id: ${level.inventory_item_id}`
      )
    }
  }
}

type LocationLevelInput = { location_id: string }
type ItemLocationLevelInput = LocationLevelInput & { inventory_item_id: string }

type ItemLevelsBody = {
  location_id?: string
  create?: LocationLevelInput[]
  update?: LocationLevelInput[]
}

type BatchLevelsBody = {
  create?: ItemLocationLevelInput[]
  update?: ItemLocationLevelInput[]
}

export const ensureItemLevelsMatchSeller = async (
  req: AuthenticatedMedusaRequest<ItemLevelsBody>,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const { id } = req.params
  const body = req.validatedBody

  const locationIds = [
    ...(body.location_id ? [body.location_id] : []),
    ...(body.create ?? []).map((l) => l.location_id),
    ...(body.update ?? []).map((l) => l.location_id),
  ]

  await validateLevelsMatchItemSeller(
    req.scope,
    locationIds.map((location_id) => ({ inventory_item_id: id, location_id }))
  )

  return next()
}

export const ensureBatchLevelsMatchSeller = async (
  req: AuthenticatedMedusaRequest<BatchLevelsBody>,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const body = req.validatedBody

  await validateLevelsMatchItemSeller(req.scope, [
    ...(body.create ?? []),
    ...(body.update ?? []),
  ])

  return next()
}
