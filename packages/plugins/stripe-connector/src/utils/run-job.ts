import { Logger, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import StripeConnectorModuleService from "../modules/stripe-connector/service"
import { JobRunDTO, JobTrigger, PayoutJobName, ResolvedStripeConnectorOptions } from "../types/common"
import { resolveConnector } from "./payout-module"

export type JobStats = Record<string, number | string | null>

export type JobContext = {
  container: MedusaContainer
  connector: StripeConnectorModuleService
  options: ResolvedStripeConnectorOptions
  logger: Logger
  stats: JobStats
  now: Date
}

type Locking = {
  acquire: (key: string, args: { expire: number; ownerId: string }) => Promise<unknown>
  release: (key: string, args: { ownerId: string }) => Promise<unknown>
}

const LOCK_EXPIRE_SECONDS = 15 * 60

/**
 * One lock per job so overlapping runs skip, and one job run row per
 * execution with the stats the job collected.
 */
export async function runJob(
  container: MedusaContainer,
  job: PayoutJobName,
  trigger: JobTrigger,
  fn: (ctx: JobContext) => Promise<void>
): Promise<JobRunDTO | null> {
  const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
  const connector = resolveConnector(container)
  const lockKey = `payout:${job}`

  let locking: Locking | null = null
  try {
    locking = container.resolve<Locking>(Modules.LOCKING)
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

  const run = await connector.startJobRun({ job, trigger })
  const stats: JobStats = {}
  logger.info(`[${job}] starting`)

  try {
    await fn({ container, connector, options: connector.getOptions(), logger, stats, now: new Date() })
    logger.info(`[${job}] job succeeded`)
    return await connector.finishJobRun(run.id, { stats })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`[${job}] failed: ${message}`)
    return await connector.finishJobRun(run.id, { stats, error: message })
  } finally {
    if (locking) {
      await locking.release(lockKey, { ownerId: job }).catch(() => null)
    }
  }
}
