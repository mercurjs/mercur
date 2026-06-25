import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ProductChangeDTO, ProductChangeStatus } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ product_change: ProductChangeDTO | null }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id

  const { data: changes } = await query.graph({
    entity: "product_change",
    fields: ["*", "actions.*"],
    filters: {
      product_id: productId,
      created_by: sellerId,
      status: ProductChangeStatus.PENDING,
    },
  })

  res.json({ product_change: changes[0] ?? null })
}
