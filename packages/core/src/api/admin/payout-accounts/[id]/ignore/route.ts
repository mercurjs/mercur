import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../../../modules/payout/services/payout-module-service"
import { AdminIgnorePayoutAccountType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminIgnorePayoutAccountType>,
  res: MedusaResponse<HttpTypes.AdminPayoutAccountResponse>
) => {
  const service = req.scope.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await service.updatePayoutAccounts({ id: req.params.id, ignored: req.validatedBody.ignored })

  const {
    data: [payout_account],
  } = await query.graph({
    entity: "payout_account",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ payout_account })
}
