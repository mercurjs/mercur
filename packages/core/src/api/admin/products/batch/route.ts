import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, UpdateProductDTO } from "@mercurjs/types"

import { batchUpdateProductsWorkflow } from "../../../../workflows/product/workflows/batch-update-products"
import { formatProductAttributes } from "../helpers"
import { AdminBatchUpdateProductsType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchUpdateProductsType>,
  res: MedusaResponse<HttpTypes.AdminProductListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, products } = req.validatedBody

  const { result } = await batchUpdateProductsWorkflow(req.scope).run({
    input: {
      products: products as (UpdateProductDTO & { id: string })[],
      additional_data,
    },
  })

  const ids = result.map((p) => p.id)

  const { data: updated } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: ids },
  })

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
