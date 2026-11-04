import { batchLinkProductsToCollectionWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { refetchCollection } from "../../helpers"
import { ensureSellerOwnsProducts } from "../../../sales-channels/helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminBatchLink,
    HttpTypes.AdminCollectionParams
  >,
  res: MedusaResponse<HttpTypes.AdminCollectionResponse>
) => {
  const id = req.params.id
  const { add = [], remove = [] } = req.validatedBody

  await ensureSellerOwnsProducts(req.scope, req.seller_context!.seller_id, [
    ...add,
    ...remove,
  ])

  const workflow = batchLinkProductsToCollectionWorkflow(req.scope)
  await workflow.run({
    input: {
      id,
      add,
      remove,
    },
  })

  const collection = await refetchCollection(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({
    collection,
  })
}
