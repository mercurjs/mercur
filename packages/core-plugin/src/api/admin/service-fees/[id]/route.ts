import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminUpdateServiceFeeType } from "../validators"
import {
  updateServiceFeesWorkflow,
  deleteServiceFeesWorkflow,
} from "../../../../workflows/service-fee"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminServiceFeeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [service_fee],
  } = await query.graph({
    entity: "service_fee",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ service_fee })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateServiceFeeType>,
  res: MedusaResponse<HttpTypes.AdminServiceFeeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateServiceFeesWorkflow(req.scope).run({
    input: [{ id: req.params.id, ...req.validatedBody }],
  })

  const {
    data: [service_fee],
  } = await query.graph({
    entity: "service_fee",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ service_fee })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminServiceFeeDeleteResponse>
) => {
  await deleteServiceFeesWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.status(200).json({
    id: req.params.id,
    object: "service_fee",
    deleted: true,
  })
}
