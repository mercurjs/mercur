import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import ReviewModuleService from "../../../modules/review/service"

export const deleteReviewStep = createStep(
  "delete-review",
  async (id: string, { container }) => {
    const service = container.resolve<ReviewModuleService>(MercurModules.REVIEW)

    await service.softDeleteReviews(id)

    return new StepResponse(id, id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }
    const service = container.resolve<ReviewModuleService>(MercurModules.REVIEW)
    await service.restoreReviews(id)
  }
)
