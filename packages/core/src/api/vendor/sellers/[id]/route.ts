import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { VendorUpdateSellerType } from "../validators"
import { updateSellersWorkflow } from "../../../../workflows/seller"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorSellerResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!seller) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Seller with id: ${req.params.id} was not found`
    )
  }

  res.json({ seller })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateSellerType>,
  res: MedusaResponse<HttpTypes.VendorSellerResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateSellersWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update: req.validatedBody,
    },
  })

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ seller })
}
