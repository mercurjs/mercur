import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes, MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutProviderListResponse>
) => {
  const service = req.scope.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const payout_providers = await service.listRegisteredPayoutProviders()
  res.json({ payout_providers })
}
