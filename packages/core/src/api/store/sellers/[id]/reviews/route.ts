import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { StoreReviewListResponse } from "@mercurjs/types"

import { listPublishedReviews } from "../../../reviews/helpers"
import { StoreGetPublicReviewsParamsType } from "../../../reviews/validators"
import { validateSellerVisibility } from "../../helpers"

export const GET = async (
  req: MedusaRequest<StoreGetPublicReviewsParamsType>,
  res: MedusaResponse<StoreReviewListResponse>
) => {
  await validateSellerVisibility(req)
  await listPublishedReviews(req, res)
}
