import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http"

import { AdminExternalPaymentResponse } from "../../../../../../../types"
import { cancelExternalPaymentWorkflow } from "../../../../../../../workflows"
import { EXTERNAL_PAYMENT_FIELDS } from "../../../payment-fields"
import { AdminCancelExternalPaymentType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCancelExternalPaymentType>,
  res: MedusaResponse<AdminExternalPaymentResponse>
) => {
  const { result } = await cancelExternalPaymentWorkflow(req.scope).run({
    input: {
      order_group_id: req.params.id,
      canceled_by: req.auth_context?.actor_id,
      ...req.validatedBody,
    },
  })

  const payment = await refetchEntity({
    entity: "payment",
    idOrFilter: result.payment_id,
    scope: req.scope,
    fields: EXTERNAL_PAYMENT_FIELDS,
  })

  res.status(200).json({ payment })
}
