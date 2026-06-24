import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

import { MESSAGING_MODULE } from "../../../../modules/messaging"
import type MessagingModuleService from "../../../../modules/messaging/service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const sellerId = req.auth_context.actor_id

  const unread_count = await service.getUnreadCountTotal({
    seller_id: sellerId,
  })

  res.json({ unread_count })
}
