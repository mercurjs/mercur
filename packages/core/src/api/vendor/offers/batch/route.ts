import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CreateOfferDTO } from "@mercurjs/types"

import { createOffersWorkflow } from "../../../../workflows/offer"
import { VendorCreateOffersBatchType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateOffersBatchType>,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id
  const memberId = req.auth_context.actor_id

  const offers: CreateOfferDTO[] = req.validatedBody.offers.map((o) => ({
    seller_id: sellerId,
    created_by: memberId,
    sku: o.sku,
    variant_id: o.variant_id,
    shipping_profile_id: o.shipping_profile_id,
    prices: o.prices,
    ean: o.ean ?? null,
    upc: o.upc ?? null,
    metadata: o.metadata ?? null,
    inline_inventory_item: {
      title: o.title,
      required_quantity: o.required_quantity,
      stock_levels: o.stock_levels,
    },
  }))

  const { result } = await createOffersWorkflow(req.scope).run({
    input: { offers },
  })

  const offerIds = result.map((o) => o.id)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: refreshed } = await query.graph({
    entity: "offer",
    filters: { id: offerIds },
    fields: req.queryConfig.fields,
  })

  res.status(201).json({ offers: refreshed })
}
