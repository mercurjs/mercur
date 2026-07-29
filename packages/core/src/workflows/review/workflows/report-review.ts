import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"

import { ReportReviewDTO } from "../../../modules/review"
import { createReviewReportStep } from "../steps"

export const reportReviewWorkflow = createWorkflow(
  {
    name: "report-review",
  },
  function (input: ReportReviewDTO) {
    const report = createReviewReportStep(input)

    return new WorkflowResponse(report)
  }
)
