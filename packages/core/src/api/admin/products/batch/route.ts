import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, UpdateProductDTO } from "@mercurjs/types"

import { batchProductsWorkflow } from "../../../../workflows/product/workflows/batch-products"
import { formatProductAttributes } from "../../../utils"
import { AdminBatchProductsType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchProductsType>,
  res: MedusaResponse<HttpTypes.AdminProductListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, update, delete: deleteIds } = req.validatedBody

  const { result } = await batchProductsWorkflow(req.scope).run({
    input: {
      update: update as (UpdateProductDTO & { id: string })[] | undefined,
      delete: deleteIds,
      additional_data,
    },
  })

  const ids = result.map((p) => p.id)

  const { data: updated } = ids.length
    ? await query.graph({
        entity: "product",
        fields: req.queryConfig.fields,
        filters: { id: ids },
      })
    : { data: [] }

  for (const product of updated) {
    formatProductAttributes(product)
  }

  res.json({
    products: updated,
    count: updated.length,
    offset: 0,
    limit: updated.length,
  })
}
