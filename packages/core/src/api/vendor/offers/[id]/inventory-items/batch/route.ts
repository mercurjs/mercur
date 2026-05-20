import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { batchOfferInventoryItemsWorkflow } from "../../../../../../workflows/offer"
import { refetchOffer, validateSellerOffer } from "../../../helpers"
import { VendorBatchOfferInventoryItemsType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBatchOfferInventoryItemsType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  await validateSellerOffer(req.scope, req.seller_context!.seller_id, id)

  const { result } = await batchOfferInventoryItemsWorkflow(req.scope).run({
    input: {
      offer_id: id,
      ...req.validatedBody,
    },
  })

  const offer = await refetchOffer(id, req.scope, req.queryConfig.fields)

  res.json({
    created: result.created,
    updated: result.updated,
    deleted: result.deleted,
    offer,
  })
}
