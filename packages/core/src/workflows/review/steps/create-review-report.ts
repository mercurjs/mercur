import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import { ReportReviewDTO } from "@mercurjs/types"
import ReviewModuleService from "../../../modules/review/service"

export const createReviewReportStep = createStep(
  "create-review-report",
  async (input: ReportReviewDTO, { container }) => {
    const service = container.resolve<ReviewModuleService>(MercurModules.REVIEW)

    const report = await service.createReviewReports(input)

    return new StepResponse(report, report.id)
  },
  async (reportId, { container }) => {
    if (!reportId) {
      return
    }

    const service = container.resolve<ReviewModuleService>(MercurModules.REVIEW)
    await service.deleteReviewReports(reportId)
  }
)
