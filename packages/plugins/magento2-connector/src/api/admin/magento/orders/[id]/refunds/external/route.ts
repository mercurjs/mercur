import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { recordExternalRefundWorkflow } from "../../../../../../../workflows"
import { AdminRecordExternalRefundType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRecordExternalRefundType>,
  res: MedusaResponse
) => {
  const { result } = await recordExternalRefundWorkflow(req.scope).run({
    input: {
      order_id: req.params.id,
      created_by: req.auth_context?.actor_id,
      ...req.validatedBody,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [payment],
  } = await query.graph({
    entity: "payment",
    fields: [
      "id",
      "amount",
      "currency_code",
      "provider_id",
      "captured_at",
      "refunds.id",
      "refunds.amount",
      "refunds.note",
      "refunds.created_at",
    ],
    filters: { id: result.id },
  })

  res.json({ payment })
}
