import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { getOffersListWorkflow } from "../../../workflows/offer/workflows"
import { AdminGetOffersParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetOffersParamsType>,
  res: MedusaResponse
) => {
  const { result } = await getOffersListWorkflow(req.scope).run({
    input: {
      fields: req.queryConfig.fields,
      filters: req.filterableFields,
      pagination: req.queryConfig.pagination,
    },
  })

  res.json(result)
}
