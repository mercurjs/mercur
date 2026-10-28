import { model } from "@medusajs/framework/utils"

import { JobRunStatus, JobTrigger } from "../../../types/common"

export const ConnectorJobRun = model
  .define("connector_job_run", {
    id: model.id({ prefix: "cjrun" }).primaryKey(),
    job: model.text(),
    trigger: model.enum(JobTrigger).default(JobTrigger.SCHEDULE),
    status: model.enum(JobRunStatus).default(JobRunStatus.RUNNING),
    started_at: model.dateTime(),
    finished_at: model.dateTime().nullable(),
    stats: model.json().nullable(),
    error: model.text().nullable(),
  })
  .indexes([
    {
      name: "IDX_connector_job_run_job_started_at",
      on: ["job", "started_at"],
      where: "deleted_at IS NULL",
    },
  ])
