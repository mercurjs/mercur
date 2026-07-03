import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  deleteOffersWorkflow,
  updateOffersWorkflow,
} from "../../../../workflows/offer"
import { refetchOffer, validateSellerOffer } from "../helpers"
import { VendorUpdateOfferType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await validateSellerOffer(req.scope, req.seller_context!.seller_id, id)

  const offer = await refetchOffer(id, req.scope, req.queryConfig.fields)

  if (!offer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer with id: ${id} was not found`
    )
  }

  res.json({ offer })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateOfferType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  await validateSellerOffer(req.scope, req.seller_context!.seller_id, id)

  await updateOffersWorkflow(req.scope).run({
    input: {
      offers: [{ id, ...req.validatedBody }],
    },
  })

  const offer = await refetchOffer(id, req.scope, req.queryConfig.fields)

  res.json({ offer })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  await validateSellerOffer(req.scope, req.seller_context!.seller_id, id)

  await deleteOffersWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.json({ id, object: "offer", deleted: true })
}
