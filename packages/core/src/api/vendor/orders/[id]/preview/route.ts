import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerOrder } from "../../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorOrderPreviewResponse>
) => {
  const { id } = req.params
  const sellerId = req.auth_context.actor_id

  await validateSellerOrder(req.scope, sellerId, id)

  const orderModuleService = req.scope.resolve(Modules.ORDER)

  const order = await orderModuleService.previewOrderChange(id)

  res.json({ order })
}
