import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { getOffersListWorkflow } from "../../../workflows/offer/workflows"
import { groupedAdminOfferFields } from "./query-config"
import { AdminGetOffersParamsType } from "./validators"

const PRODUCT_FILTER_KEYS = [
  "q",
  "status",
  "category_id",
  "collection_id",
  "type_id",
  "tag_id",
] as const

const getGroupedOffers = async (
  req: AuthenticatedMedusaRequest<AdminGetOffersParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { skip, take } = req.queryConfig.pagination

  const productFilters: Record<string, unknown> = {}
  for (const key of PRODUCT_FILTER_KEYS) {
    const value = req.filterableFields[key]
    if (value !== undefined && value !== null) {
      productFilters[key] = value
    }
  }

  let productIds: string[] | undefined
  if (Object.keys(productFilters).length) {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id"],
      filters: productFilters,
    })
    productIds = products.map((product: { id: string }) => product.id)
    if (!productIds.length) {
      return res.json({ offers: [], count: 0, offset: skip, limit: take })
    }
  }

  const sellerId = req.filterableFields.seller_id as
    | string
    | string[]
    | undefined

  const { result } = await getOffersListWorkflow(req.scope).run({
    input: {
      fields: groupedAdminOfferFields,
      filters: {
        ...(productIds ? { product_id: productIds } : {}),
        ...(sellerId ? { seller_id: sellerId } : {}),
      },
      pagination: req.queryConfig.pagination,
    },
  })

  res.json({
    offers: result.rows,
    count: result.metadata.count,
    offset: result.metadata.skip,
    limit: result.metadata.take,
  })
}

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetOffersParamsType>,
  res: MedusaResponse
) => {
  const grouped = req.filterableFields.grouped === true
  delete req.filterableFields.grouped

  if (grouped) {
    return getGroupedOffers(req, res)
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: offers, metadata } = await query.graph({
    entity: "offer",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    offers,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
