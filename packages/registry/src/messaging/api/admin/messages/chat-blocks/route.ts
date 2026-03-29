import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

import { blockCustomerWorkflow } from "../../../../workflows/messaging/workflows/block-customer"
import { AdminBlockCustomerType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBlockCustomerType>,
  res: MedusaResponse
) => {
  const adminUserId = req.auth_context.actor_id

  const { result: block } = await blockCustomerWorkflow.run({
    container: req.scope,
    input: {
      customer_id: req.validatedBody.customer_id,
      blocked_by: adminUserId,
      reason: req.validatedBody.reason ?? null,
    },
  })

  res.status(201).json({ block })
}
