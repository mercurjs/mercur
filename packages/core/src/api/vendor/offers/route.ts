import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"

import { createOffersWorkflow } from "../../../workflows/offer"
import { refetchOffer } from "./helpers"
import { VendorCreateOfferType, VendorGetOffersParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetOffersParamsType>,
  res: MedusaResponse
) => {
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

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateOfferType>,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id
  const memberId = req.auth_context.actor_id

  const { result } = await createOffersWorkflow(req.scope).run({
    input: {
      offers: [
        {
          ...req.validatedBody,
          seller_id: sellerId,
          created_by: memberId,
        },
      ],
    },
  })

  const offer = await refetchOffer(
    result[0].id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(201).json({ offer })
}
