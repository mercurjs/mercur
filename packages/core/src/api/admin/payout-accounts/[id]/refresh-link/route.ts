import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../../../modules/payout/services/payout-module-service"
import { createOnboardingWorkflow } from "../../../../../workflows/payout"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutAccountResponse>
) => {
  const service = req.scope.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const account = await service.retrievePayoutAccount(req.params.id)

  if (account.details_submitted) {
    await service.refreshLoginLink(account.id)
  } else {
    await createOnboardingWorkflow(req.scope).run({
      input: { account_id: account.id, data: {}, context: {} },
    })
  }

  const {
    data: [payout_account],
  } = await query.graph({
    entity: "payout_account",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ payout_account })
}
