import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes, MercurModules } from "@mercurjs/types"

import { AdminBatchCommissionRulesType, AdminUpdateCommissionRateType } from "../validators"
import { batchCommissionRulesWorkflow, deleteCommissionRatesWorkflow, updateCommissionRatesWorkflow } from "../../../../workflows/commission"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminCommissionRateResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [commission_rate],
  } = await query.graph({
    entity: "commission_rate",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!commission_rate) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Commission rate with id ${req.params.id} was not found`
    )
  }

  res.json({ commission_rate })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateCommissionRateType>,
  res: MedusaResponse<HttpTypes.AdminCommissionRateResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await updateCommissionRatesWorkflow(req.scope).run({
    input: [{ id: req.params.id, ...req.validatedBody }],
  })

  const {
    data: [commission_rate],
  } = await query.graph({
    entity: "commission_rate",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  res.json({ commission_rate })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminCommissionRateDeleteResponse>
) => {
  await deleteCommissionRatesWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.json({
    id: req.params.id,
    object: "commission_rate",
    deleted: true,
  })
}
