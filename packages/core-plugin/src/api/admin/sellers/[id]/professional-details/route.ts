import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, MercurModules } from "@mercurjs/types"

import { AdminUpsertSellerProfessionalDetailsType } from "../../validators"
import { updateSellerProfessionalDetailsWorkflow } from "../../../../../workflows/seller"
import SellerModuleService from "../../../../../modules/seller/service"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpsertSellerProfessionalDetailsType>,
  res: MedusaResponse<HttpTypes.AdminSellerResponse>
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
  res: MedusaResponse<HttpTypes.AdminSellerResponse>
) => {
  const service = req.scope.resolve<SellerModuleService>(MercurModules.SELLER)
  const existing = await service.listProfessionalDetails({
    seller_id: req.params.id,
  })

  if (existing.length > 0) {
    await service.deleteProfessionalDetails([existing[0].id])
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
