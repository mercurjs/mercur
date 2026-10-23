import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { HttpTypes, MercurModules, PayoutStatus } from "@mercurjs/types"

import PayoutModuleService from "../../../../../modules/payout/services/payout-module-service"
import { processPayoutWorkflow } from "../../../../../workflows/payout"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutResponse>
) => {
  const service = req.scope.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const current = await service.retrievePayout(req.params.id)

  if (![PayoutStatus.FAILED, PayoutStatus.ON_HOLD, PayoutStatus.PENDING].includes(current.status)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Payout ${current.id} is ${current.status} and cannot be retried`)
  }

  await service.updatePayouts({ id: current.id, status: PayoutStatus.PENDING, status_reason: null })
  await processPayoutWorkflow(req.scope).run({ input: { payout_id: current.id } })

  const {
    data: [payout],
  } = await query.graph({
    entity: "payout",
    fields: req.queryConfig.fields,
    filters: { id: current.id },
  })

  res.json({ payout })
}
