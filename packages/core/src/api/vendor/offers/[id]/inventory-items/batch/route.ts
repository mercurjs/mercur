import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { batchOfferInventoryItemsWorkflow } from "../../../../../../workflows/offer"
import { validateSellerInventoryItems } from "../../../../inventory-items/helpers"
import { refetchOffer, validateSellerOffer } from "../../../helpers"
import { VendorBatchOfferInventoryItemsType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBatchOfferInventoryItemsType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const sellerId = req.seller_context!.seller_id
  await validateSellerOffer(req.scope, sellerId, id)
  await validateSellerInventoryItems(req.scope, sellerId, [
    ...(req.validatedBody.create ?? []),
    ...(req.validatedBody.update ?? []),
  ].map((item) => item.inventory_item_id))

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
