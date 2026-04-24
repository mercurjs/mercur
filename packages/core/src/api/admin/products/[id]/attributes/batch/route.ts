import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { batchProductAttributesWorkflow } from "../../../../../../workflows/product/workflows/batch-product-attributes"
import { AdminBatchProductAttributesType } from "../../../../products/validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchProductAttributesType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  await batchProductAttributesWorkflow(req.scope).run({
    input: {
      product_id: productId,
      create: req.validatedBody.create,
      delete: req.validatedBody.delete,
    },
  })

  const createdIds = (req.validatedBody.create ?? []).map(
    (c) => c.attribute_id
  )

  let created: any[] = []
  if (createdIds.length) {
    const { data } = await query.graph({
      entity: "product_attribute",
      fields: req.queryConfig.fields,
      filters: { id: createdIds },
    })
    created = data
  }

  res.status(200).json({
    created,
    deleted: {
      ids: req.validatedBody.delete ?? [],
      object: "product_attribute",
      deleted: true,
    },
  })
}
