import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { StoreReviewListResponse } from "@mercurjs/types"

import { listPublishedReviews } from "../../../reviews/helpers"
import { StoreGetPublicReviewsParamsType } from "../../../reviews/validators"
import { validateProductVisibility } from "../../helpers"

export const GET = async (
  req: MedusaStoreRequest<StoreGetPublicReviewsParamsType>,
  res: MedusaResponse<StoreReviewListResponse>
) => {
  await validateProductVisibility(req)
  await listPublishedReviews(req, res)
}
