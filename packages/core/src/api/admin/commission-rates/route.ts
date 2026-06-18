import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminCreateCommissionRateType } from "./validators"
import { createCommissionRatesWorkflow } from "../../../workflows/commission"

/**
 * Derive a rule's scope type from the set of `reference`s on its rules.
 * Mirrors the admin-side `deriveScopeType` (scope type is not stored).
 */
const deriveScopeType = (references: string[]): string | null => {
  const refs = new Set(references)
  const hasSeller = refs.has("seller")
  const hasType = refs.has("product_type")
  const hasCategory = refs.has("product_category")

  if (hasSeller && hasType) return "store_product_type"
  if (hasSeller && hasCategory) return "store_category"
  if (hasSeller) return "store"
  if (hasType) return "product_type"
  if (hasCategory) return "category"
  return null
}

/** Build a unique, URL-safe code from a rate name. */
const generateCommissionCode = (name: string): string => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${slug || "commission-rule"}-${suffix}`
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminCommissionRateListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // `scope_type` is a virtual filter derived from each rate's rules; resolve
  // it to a concrete set of rate ids before running the paginated query.
  const { scope_type, ...filters } = req.filterableFields as Record<
    string,
    unknown
  > & { scope_type?: string | string[] }

  let scopedIds: string[] | undefined
  if (scope_type) {
    const scopeTypes = Array.isArray(scope_type) ? scope_type : [scope_type]

    const { data: allRates } = await query.graph({
      entity: "commission_rate",
      fields: ["id", "rules.reference"],
      filters,
    })

    scopedIds = allRates
      .filter((rate: { rules?: { reference: string }[] }) => {
        const derived = deriveScopeType(
          (rate.rules ?? []).map((rule) => rule.reference)
        )
        return derived !== null && scopeTypes.includes(derived)
      })
      .map((rate: { id: string }) => rate.id)

    if (scopedIds.length === 0) {
      res.json({
        commission_rates: [],
        count: 0,
        offset: req.queryConfig.pagination?.skip ?? 0,
        limit: req.queryConfig.pagination?.take ?? 0,
      })
      return
    }
  }

  const { data: commission_rates, metadata } = await query.graph({
    entity: "commission_rate",
    fields: req.queryConfig.fields,
    filters: scopedIds ? { ...filters, id: scopedIds } : filters,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    commission_rates,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateCommissionRateType>,
  res: MedusaResponse<HttpTypes.AdminCommissionRateResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const code =
    req.validatedBody.code ?? generateCommissionCode(req.validatedBody.name)

  const { result } = await createCommissionRatesWorkflow(req.scope).run({
    input: [{ ...req.validatedBody, code }],
  })

  const {
    data: [commission_rate],
  } = await query.graph({
    entity: "commission_rate",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  res.status(201).json({ commission_rate })
}
