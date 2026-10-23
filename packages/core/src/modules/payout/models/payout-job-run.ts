import { model } from "@medusajs/framework/utils"

import { PayoutJobRunStatus, PayoutJobTrigger } from "@mercurjs/types"

export const PayoutJobRun = model
  .define("payout_job_run", {
    id: model.id({ prefix: "pjrun" }).primaryKey(),
    job: model.text(),
    trigger: model.enum(PayoutJobTrigger).default(PayoutJobTrigger.SCHEDULE),
    status: model.enum(PayoutJobRunStatus).default(PayoutJobRunStatus.RUNNING),
    started_at: model.dateTime(),
    finished_at: model.dateTime().nullable(),
    stats: model.json().nullable(),
    error: model.text().nullable(),
  })
  .indexes([
    {
      name: "IDX_payout_job_run_job_started_at",
      on: ["job", "started_at"],
      where: "deleted_at IS NULL",
    },
  ])
