import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes as MedusaHttpTypes } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import { linkSellerRegionsWorkflow } from "../../../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest<MedusaHttpTypes.AdminBatchLink>,
  res: MedusaResponse<HttpTypes.AdminSellerRegionsBatchResponse>
) => {
  const { add, remove } = req.validatedBody
  const sellerId = req.params.id

  await linkSellerRegionsWorkflow(req.scope).run({
    input: {
      add: (add ?? []).map((region_id) => ({ seller_id: sellerId, region_id })),
      remove: (remove ?? []).map((region_id) => ({
        seller_id: sellerId,
        region_id,
      })),
    },
  })

  res.status(200).json({ id: sellerId, object: "seller" })
}
