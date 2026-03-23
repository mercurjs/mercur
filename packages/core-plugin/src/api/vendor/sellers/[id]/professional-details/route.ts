import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, MercurModules } from "@mercurjs/types"

import { VendorUpsertSellerProfessionalDetailsType } from "../../validators"
import { updateSellerProfessionalDetailsWorkflow } from "../../../../../workflows/seller"
import SellerModuleService from "../../../../../modules/seller/service"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpsertSellerProfessionalDetailsType>,
  res: MedusaResponse<HttpTypes.VendorSellerResponse>
) => {
  await updateSellerProfessionalDetailsWorkflow(req.scope).run({
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

