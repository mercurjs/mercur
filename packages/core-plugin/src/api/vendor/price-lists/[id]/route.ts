import {
  deletePriceListsWorkflow,
  updatePriceListsWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { fetchPriceList, validateSellerPriceList } from "../helpers"
import { VendorUpdatePriceListType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorPriceListResponse>
) => {
  const sellerId = req.auth_context.actor_id

  await validateSellerPriceList(req.scope, sellerId, req.params.id)

  const price_list = await fetchPriceList(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ price_list })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdatePriceListType>,
  res: MedusaResponse<HttpTypes.VendorPriceListResponse>
) => {
  const id = req.params.id
  const sellerId = req.auth_context.actor_id

  await validateSellerPriceList(req.scope, sellerId, id)

  const workflow = updatePriceListsWorkflow(req.scope)

  await workflow.run({
    input: { price_lists_data: [{ ...req.validatedBody, id }] },
  })

  const price_list = await fetchPriceList(id, req.scope, req.queryConfig.fields)

  res.status(200).json({ price_list })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorDeleteResponse>
) => {
  const id = req.params.id
  const sellerId = req.auth_context.actor_id

  await validateSellerPriceList(req.scope, sellerId, id)

  const workflow = deletePriceListsWorkflow(req.scope)

  await workflow.run({
    input: { ids: [id] },
  })

  res.status(200).json({
    id,
    object: "price_list",
    deleted: true,
  })
}
