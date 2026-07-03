import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ProductChangeDTO, ProductChangeStatus } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ product_change: ProductChangeDTO | null }>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  const { data: changes } = await query.graph({
    entity: "product_change",
    fields: ["*", "actions.*"],
    filters: {
      product_id: productId,
      status: ProductChangeStatus.PENDING,
    },
  })

  res.json({ product_change: (changes[0] as ProductChangeDTO) ?? null })
}
