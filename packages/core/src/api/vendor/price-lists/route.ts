import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { createSellerPriceListsWorkflow } from "../../../workflows/price-list"
import { transformPriceList } from "./helpers"
import { VendorCreatePriceListType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorPriceListListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: priceLists, metadata } = await query.graph({
    entity: "price_list",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    price_lists: priceLists.map((priceList) => transformPriceList(priceList)),
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreatePriceListType>,
  res: MedusaResponse<HttpTypes.VendorPriceListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.auth_context.actor_id

  const { result } = await createSellerPriceListsWorkflow(req.scope).run({
    input: {
      price_lists_data: [req.validatedBody],
      seller_id: sellerId,
    },
  })

  const {
    data: [priceList],
  } = await query.graph({
    entity: "price_list",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  res.status(201).json({ price_list: transformPriceList(priceList) })
}
