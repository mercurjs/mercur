import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminUpsertSellerProfessionalDetailsType } from "../../validators"
import {
  updateSellerProfessionalDetailsWorkflow,
  deleteSellerProfessionalDetailsWorkflow,
} from "../../../../../workflows/seller"

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
  await deleteSellerProfessionalDetailsWorkflow(req.scope).run({
    input: {
      seller_id: req.params.id,
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
