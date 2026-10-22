import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http"

import { AdminExternalPaymentResponse } from "../../../../../../../types"
import { captureExternalPaymentWorkflow } from "../../../../../../../workflows"
import { EXTERNAL_PAYMENT_FIELDS } from "../../../payment-fields"
import { AdminCaptureExternalPaymentType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCaptureExternalPaymentType>,
  res: MedusaResponse<AdminExternalPaymentResponse>
) => {
  const { result } = await captureExternalPaymentWorkflow(req.scope).run({
    input: {
      order_group_id: req.params.id,
      captured_by: req.auth_context?.actor_id,
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
