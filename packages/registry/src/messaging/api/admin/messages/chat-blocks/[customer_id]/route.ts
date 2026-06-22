import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

import { MESSAGING_MODULE } from "../../../../../modules/messaging"
import type MessagingModuleService from "../../../../../modules/messaging/service"
import { unblockCustomerWorkflow } from "../../../../../workflows/messaging/workflows/unblock-customer"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const blocked = await service.checkBuyersBlocked([req.params.customer_id])

  res.json({ is_blocked: blocked.has(req.params.customer_id) })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await unblockCustomerWorkflow.run({
    container: req.scope,
    input: { customer_id: req.params.customer_id },
  })

  res.status(200).json({ success: true })
}
