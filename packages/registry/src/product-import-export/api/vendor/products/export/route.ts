import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { exportSellerProductsWorkflow } from "../../../../workflows/export-seller-products"
import { fetchSellerByAuthActorId } from "../_helpers/helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ url: string }>
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  if (!seller) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Seller not found for the current user."
    )
  }

  const { result } = await exportSellerProductsWorkflow(req.scope).run({
    input: {
      seller_id: seller.id,
    },
  })

  res.json(result)
}
