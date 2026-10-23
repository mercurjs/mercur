import { Logger, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  MercurModules,
  PayoutJobName,
  PayoutJobRunDTO,
  PayoutJobTrigger,
} from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export type PayoutJobStats = Record<string, number | string | null>

export type PayoutJobContext = {
  container: MedusaContainer
  service: PayoutModuleService
  logger: Logger
  stats: PayoutJobStats
  now: Date
}

const LOCK_EXPIRE_SECONDS = 15 * 60

/**
 * Shared wrapper for the seven payout jobs: one lock per job name so
 * overlapping runs skip, one `payout_job_run` row per execution, and
 * `starting` / `job succeeded` log lines.
 */
export async function runPayoutJob(
  container: MedusaContainer,
  job: PayoutJobName,
  trigger: PayoutJobTrigger,
  fn: (ctx: PayoutJobContext) => Promise<void>
): Promise<PayoutJobRunDTO | null> {
  const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const lockKey = `payout:${job}`

  let locking: { acquire: Function; release: Function } | null = null
  try {
    locking = container.resolve(Modules.LOCKING)
  } catch {
    locking = null
  }

  if (locking) {
    try {
      await locking.acquire(lockKey, { expire: LOCK_EXPIRE_SECONDS, ownerId: job })
    } catch {
      logger.info(`[${job}] skipped, a run is already in progress`)
      return null
    }
  }

  const run = await service.startJobRun({ job, trigger })
  const stats: PayoutJobStats = {}
  logger.info(`[${job}] starting`)

  try {
    await fn({ container, service, logger, stats, now: new Date() })
    logger.info(`[${job}] job succeeded`)
    return await service.finishJobRun(run.id, { stats })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`[${job}] failed: ${message}`)
    return await service.finishJobRun(run.id, { stats, error: message })
  } finally {
    if (locking) {
      await locking.release(lockKey, { ownerId: job }).catch(() => null)
    }
  }
}
