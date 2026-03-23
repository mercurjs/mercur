import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { VendorUpsertSellerAddressType } from "../../validators"
import { updateSellerAddressWorkflow } from "../../../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpsertSellerAddressType>,
  res: MedusaResponse<HttpTypes.VendorSellerResponse>
) => {
  await updateSellerAddressWorkflow(req.scope).run({
    input: {
      seller_id: req.params.id,
      data: req.validatedBody,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ seller })
}
