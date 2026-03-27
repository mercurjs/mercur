import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { AdminSearchConversationsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminSearchConversationsType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)

  const {
    cursor,
    limit,
    seller_name,
    buyer_name,
    date_from,
    date_to,
    context_type,
    context_id,
  } = (req.validatedQuery ?? {}) as AdminSearchConversationsType

  const { data: conversations, next_cursor } =
    await service.searchConversationsAdmin(
      {
        seller_name,
        buyer_name,
        date_from,
        date_to,
        context_type,
        context_id,
      },
      { cursor, limit }
    )

  res.json({ conversations, next_cursor })
}
