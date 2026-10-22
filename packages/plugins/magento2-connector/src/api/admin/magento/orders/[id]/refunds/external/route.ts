import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http"

import { AdminExternalRefundResponse } from "../../../../../../../types"
import { recordExternalRefundWorkflow } from "../../../../../../../workflows"
import { EXTERNAL_PAYMENT_FIELDS } from "../../../../order-groups/payment-fields"
import { AdminRecordExternalRefundType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRecordExternalRefundType>,
  res: MedusaResponse<AdminExternalRefundResponse>
) => {
  const { result } = await recordExternalRefundWorkflow(req.scope).run({
    input: {
      order_id: req.params.id,
      created_by: req.auth_context?.actor_id,
      ...req.validatedBody,
    },
  })

  const payment = await refetchEntity({
    entity: "payment",
    idOrFilter: result.id,
    scope: req.scope,
    fields: EXTERNAL_PAYMENT_FIELDS,
  })

  res.status(200).json({ payment })
}
