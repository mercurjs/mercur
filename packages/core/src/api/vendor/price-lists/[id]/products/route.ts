import { batchPriceListPricesWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes as VendorHttpTypes } from "@mercurjs/types"

import {
  fetchPriceList,
  fetchPriceListPriceIdsForProduct,
  validateSellerPriceList,
} from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminLinkPriceListProducts>,
  res: MedusaResponse<VendorHttpTypes.VendorPriceListResponse>
) => {
  const id = req.params.id
  const sellerId = req.auth_context.actor_id
  const { remove = [] } = req.validatedBody

  await validateSellerPriceList(req.scope, sellerId, id)

  if (!remove.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No product ids passed to remove from price list"
    )
  }

  const productPriceIds = await fetchPriceListPriceIdsForProduct(
    id,
    remove,
    req.scope
  )

  const workflow = batchPriceListPricesWorkflow(req.scope)
  await workflow.run({
    input: {
      data: {
        id,
        create: [],
        update: [],
        delete: productPriceIds,
      },
    },
  })

  const priceList = await fetchPriceList(id, req.scope, req.queryConfig.fields)

  res.status(200).json({ price_list: priceList })
}
