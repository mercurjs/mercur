import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { VendorCreateSellerType } from "./validators"
import { createSellerWorkflow } from "../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateSellerType>,
  res: MedusaResponse<HttpTypes.VendorSellerResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result: seller } = await createSellerWorkflow(req.scope).run({
    input: {
      seller: req.validatedBody,
      auth_identity_id: req.auth_context.auth_identity_id,
    },
  })

  const {
    data: [result],
  } = await query.graph({
    entity: "seller",
    fields: req.queryConfig.fields,
    filters: { id: seller.id },
  })

  res.status(201).json({ seller: result })
}
