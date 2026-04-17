import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { rejectProductWorkflow } from "../../../../../workflows/product/workflows/reject-product"
import { AdminRejectProductType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRejectProductType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { rejection_reason_ids, message } = req.validatedBody

  await rejectProductWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      rejection_reason_ids,
      message,
      actor_id: req.auth_context?.actor_id,
    },
  })

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`
    )
  }

  res.json({ product })
}
