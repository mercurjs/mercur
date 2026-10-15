import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const listSellerRegionIds = async (
  scope: MedusaContainer,
  sellerId: string
): Promise<string[]> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: links } = await query.graph({
    entity: "region_seller",
    filters: { seller_id: sellerId },
    fields: ["region_id"],
  })

  return links.map((link) => (link as { region_id: string }).region_id)
}

export const validateSellerRegions = async (
  scope: MedusaContainer,
  sellerId: string,
  regionIds: string[],
  errorType: string = MedusaError.Types.INVALID_DATA
) => {
  const ids = Array.from(new Set(regionIds))
  if (!ids.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: links } = await query.graph({
    entity: "region_seller",
    filters: {
      seller_id: sellerId,
      region_id: ids,
    },
    fields: ["region_id"],
  })

  const assigned = new Set(
    links.map((link) => (link as { region_id?: string }).region_id)
  )
  const missing = ids.find((id) => !assigned.has(id))

  if (missing) {
    throw new MedusaError(
      errorType,
      errorType === MedusaError.Types.NOT_FOUND
        ? `Region with id: ${missing} was not found`
        : `Region with id: ${missing} is not assigned to this seller`
    )
  }
}

type RegionScopedPrice = {
  currency_code?: string
  region_id?: string
  rules?: unknown
}

const regionIdFromRules = (rules: unknown): string | undefined => {
  if (!rules || typeof rules !== "object" || Array.isArray(rules)) {
    return undefined
  }
  const value = (rules as Record<string, unknown>).region_id
  return typeof value === "string" ? value : undefined
}

type RegionPrice = { region_id: string; currency_code?: string }

export const validateSellerRegionPrices = async (
  scope: MedusaContainer,
  sellerId: string,
  prices: RegionScopedPrice[]
) => {
  const regionPrices: RegionPrice[] = []
  for (const price of prices) {
    const regionId = price.region_id ?? regionIdFromRules(price.rules)
    if (regionId) {
      regionPrices.push({ region_id: regionId, currency_code: price.currency_code })
    }
  }

  if (!regionPrices.length) {
    return
  }

  const regionIds = Array.from(new Set(regionPrices.map((p) => p.region_id)))

  await validateSellerRegions(scope, sellerId, regionIds)

  const withCurrency = regionPrices.filter((p) => p.currency_code)
  if (!withCurrency.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: regions } = await query.graph({
    entity: "region",
    filters: { id: regionIds },
    fields: ["id", "currency_code"],
  })

  const currencyByRegion = new Map(
    regions.map((r) => [r.id, r.currency_code as string])
  )

  const mismatch = withCurrency.find(
    (p) =>
      currencyByRegion.get(p.region_id)?.toLowerCase() !==
      p.currency_code!.toLowerCase()
  )

  if (mismatch) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Price currency ${mismatch.currency_code} does not match the currency of region ${mismatch.region_id}`
    )
  }
}
