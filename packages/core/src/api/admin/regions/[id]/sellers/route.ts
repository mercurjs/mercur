import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes as MedusaHttpTypes } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import { linkSellerRegionsWorkflow } from "../../../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest<MedusaHttpTypes.AdminBatchLink>,
  res: MedusaResponse<HttpTypes.AdminRegionSellersBatchResponse>
) => {
  const { add, remove } = req.validatedBody
  const regionId = req.params.id

  await linkSellerRegionsWorkflow(req.scope).run({
    input: {
      add: (add ?? []).map((seller_id) => ({ seller_id, region_id: regionId })),
      remove: (remove ?? []).map((seller_id) => ({
        seller_id,
        region_id: regionId,
      })),
    },
  })

  res.status(200).json({ id: regionId, object: "region" })
}
