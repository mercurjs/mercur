import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { AdminStripeCaptureListResponse } from "../../../../types/http"
import { AdminGetCapturesParamsType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetCapturesParamsType>,
  res: MedusaResponse<AdminStripeCaptureListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: captures, metadata } = await query.graph({
    entity: "stripe_capture",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    captures: captures as unknown as AdminStripeCaptureListResponse["captures"],
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
