import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const PLATFORM_OWNER = "platform"

type Filter = Record<string, unknown>

const buildStatusFilter = (status: string, now: Date): Filter | undefined => {
  switch (status) {
    case "expired":
      return { ends_at: { $lt: now } }
    case "scheduled":
      return {
        starts_at: { $gt: now },
        $or: [{ ends_at: null }, { ends_at: { $gte: now } }],
      }
    case "active":
      return {
        $and: [
          { $or: [{ starts_at: null }, { starts_at: { $lte: now } }] },
          { $or: [{ ends_at: null }, { ends_at: { $gte: now } }] },
        ],
      }
    default:
      return undefined
  }
}

export const applyCampaignFilters = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const filterableFields = req.filterableFields ?? {}

  const sellerId = filterableFields.seller_id as string | string[] | undefined
  const budgetType = filterableFields.budget_type as string | undefined
  const status = filterableFields.status as string | undefined

  delete filterableFields.seller_id
  delete filterableFields.budget_type
  delete filterableFields.status

  if (!sellerId && !budgetType && !status) {
    return next()
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const constraints: Filter[] = []
  let noMatch = false

  // budget_type -> resolve to campaign ids through the campaign_budget table
  let budgetIds: string[] | undefined
  if (budgetType) {
    const { data } = await query.graph({
      entity: "campaign_budget",
      fields: ["campaign_id"],
      filters: { type: budgetType },
    })
    budgetIds = data.map((b: { campaign_id: string }) => b.campaign_id)
    if (!budgetIds.length) {
      noMatch = true
    }
  }

  // seller_id (incl. "platform" pseudo-owner) -> resolve through campaign_seller
  let sellerConstraint: Filter | undefined
  if (sellerId && !noMatch) {
    const requested = Array.isArray(sellerId) ? sellerId : [sellerId]
    const wantsPlatform = requested.includes(PLATFORM_OWNER)
    const requestedSellers = requested.filter((id) => id !== PLATFORM_OWNER)

    let sellerIds: string[] = []
    if (requestedSellers.length) {
      const { data } = await query.graph({
        entity: "campaign_seller",
        fields: ["campaign_id"],
        filters: { seller_id: requestedSellers },
      })
      sellerIds = data.map((l: { campaign_id: string }) => l.campaign_id)
    }

    let platformFilter: Filter | undefined
    if (wantsPlatform) {
      const { data } = await query.graph({
        entity: "campaign_seller",
        fields: ["campaign_id"],
      })
      const allLinkedIds = data.map((l: { campaign_id: string }) => l.campaign_id)
      platformFilter = allLinkedIds.length
        ? { id: { $nin: allLinkedIds } }
        : {}
    }

    const sellerFilter = requestedSellers.length
      ? { id: { $in: sellerIds } }
      : undefined

    if (sellerFilter && platformFilter) {
      // intersect budget with sellers below; platform is a disjoint branch
      sellerConstraint =
        Object.keys(platformFilter).length === 0
          ? sellerFilter
          : { $or: [sellerFilter, platformFilter] }
    } else if (sellerFilter) {
      if (!sellerIds.length) {
        noMatch = true
      } else {
        sellerConstraint = sellerFilter
      }
    } else if (platformFilter) {
      sellerConstraint = platformFilter
    }
  }

  // Intersect the two plain id allowlists (budget + real sellers) when possible
  // to keep the common path a single `id: { $in }` constraint.
  if (
    !noMatch &&
    budgetIds &&
    sellerConstraint &&
    isPlainInFilter(sellerConstraint)
  ) {
    const sellerIds = (sellerConstraint.id as { $in: string[] }).$in
    const budgetSet = new Set(budgetIds)
    const intersection = sellerIds.filter((id) => budgetSet.has(id))
    if (!intersection.length) {
      noMatch = true
    } else {
      constraints.push({ id: { $in: intersection } })
    }
    budgetIds = undefined
    sellerConstraint = undefined
  }

  if (!noMatch) {
    if (budgetIds) {
      constraints.push({ id: { $in: budgetIds } })
    }
    if (sellerConstraint) {
      constraints.push(sellerConstraint)
    }
    if (status) {
      const statusFilter = buildStatusFilter(status, new Date())
      if (statusFilter) {
        constraints.push(statusFilter)
      }
    }
  }

  if (noMatch) {
    filterableFields.id = ["__no_match__"]
    return next()
  }

  if (constraints.length) {
    const existingAnd = Array.isArray(filterableFields.$and)
      ? (filterableFields.$and as Filter[])
      : []
    filterableFields.$and = [...existingAnd, ...constraints]
  }

  return next()
}

const isPlainInFilter = (
  filter: Filter
): filter is { id: { $in: string[] } } => {
  const id = filter.id as { $in?: unknown } | undefined
  return (
    Object.keys(filter).length === 1 &&
    !!id &&
    Array.isArray((id as { $in?: unknown }).$in)
  )
}
