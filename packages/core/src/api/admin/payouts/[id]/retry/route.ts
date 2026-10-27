import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { HttpTypes, MercurModules, PayoutStatus } from "@mercurjs/types"

import PayoutModuleService from "../../../../../modules/payout/services/payout-module-service"
import { createOrderPayoutsWorkflow, processPayoutWorkflow } from "../../../../../workflows/payout"

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

  // An order payout is re-decided from the order, so one on hold only goes
  // out once the order is ready.
  if (current.order_id) {
    await createOrderPayoutsWorkflow(req.scope).run({ input: { order_ids: [current.order_id] } })
  } else {
    await processPayoutWorkflow(req.scope).run({ input: { payout_ids: [current.id] } })
  }

  const {
    data: [payout],
  } = await query.graph({
    entity: "payout",
    fields: req.queryConfig.fields,
    filters: { id: current.id },
  })

  res.json({ payout })
}
