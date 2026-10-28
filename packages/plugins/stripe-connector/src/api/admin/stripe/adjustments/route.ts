import { AuthenticatedMedusaRequest, MedusaResponse, refetchEntity } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { AdjustmentDTO } from "../../../../types/common"
import { AdminAdjustmentListResponse, AdminAdjustmentResponse } from "../../../../types/http"
import { createAdjustmentsWorkflow } from "../../../../workflows/adjustments/workflows/create-adjustments"
import { AdminCreateAdjustmentType, AdminGetAdjustmentsParamsType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetAdjustmentsParamsType>,
  res: MedusaResponse<AdminAdjustmentListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: adjustments, metadata } = await query.graph({
    entity: "adjustment",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })
  res.json({
    adjustments: adjustments as unknown as AdjustmentDTO[],
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateAdjustmentType>,
  res: MedusaResponse<AdminAdjustmentResponse>
) => {
  const { result } = await createAdjustmentsWorkflow(req.scope).run({
    input: { ...req.validatedBody, created_by: req.auth_context?.actor_id ?? null },
  })

  const adjustment = await refetchEntity({
    entity: "adjustment",
    idOrFilter: result[0].id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  res.status(201).json({ adjustment: adjustment as AdjustmentDTO })
}
