import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { VendorSettlement, VendorSettlementListResponse } from "../../../../types/http"
import { vendorSellerId } from "../../../vendor-seller"
import { AdminGetSettlementsParamsType } from "../../../admin/validators"
import { sellerAccountFilter } from "./helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetSettlementsParamsType>,
  res: MedusaResponse<VendorSettlementListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: settlements, metadata } = await query.graph({
    entity: "settlement",
    fields: req.queryConfig.fields,
    filters: { ...req.filterableFields, ...(await sellerAccountFilter(req.scope, vendorSellerId(req))) },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    settlements: settlements as unknown as VendorSettlement[],
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
