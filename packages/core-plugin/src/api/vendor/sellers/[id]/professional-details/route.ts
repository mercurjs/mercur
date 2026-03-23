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

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorSellerResponse>
) => {
  const service = req.scope.resolve<SellerModuleService>(MercurModules.SELLER)
  const existing = await service.listProfessionalDetailss({
    seller_id: req.params.id,
  })

  if (existing.length > 0) {
    await service.deleteProfessionalDetailss([existing[0].id])
  }

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
