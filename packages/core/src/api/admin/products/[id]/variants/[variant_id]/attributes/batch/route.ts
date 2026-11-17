import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { updateVariantAttributesWorkflow } from "../../../../../../../../workflows/product-attribute"
import { enrichVariantAttributes } from "../../../../../../../utils"
import { AdminBatchVariantAttributesType } from "../../../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchVariantAttributesType>,
  res: MedusaResponse<HttpTypes.AdminProductVariantResponse>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  const variantId = req.params.variant_id

  const { add, remove, update, additional_data } = req.validatedBody

  await updateVariantAttributesWorkflow(req.scope).run({
    input: {
      product_id: productId,
      variant_id: variantId,
      add,
      remove,
      update,
      additional_data,
    },
  })

  const {
    data: [variant],
  } = await query.graph({
    entity: "variant",
    fields: req.queryConfig.fields,
    filters: { id: variantId, product_id: productId },
  })

  await enrichVariantAttributes(req.scope, [variant])

  res.status(200).json({ variant })
}
