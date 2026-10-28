import { randomUUID } from "crypto"

import { Logger, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { JobRunDTO, JobTrigger, PayoutJobName } from "../types/common"
import { resolveConnector } from "./payout-module"

export type JobStats = Record<string, number | string | null>

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
  run: () => Promise<JobStats>
): Promise<JobRunDTO | null> {
  const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
  const connector = resolveConnector(container)
  const lockKey = `payout:${job}`
  const ownerId = `${job}:${randomUUID()}`

  let locking: Locking | null = null
  try {
    locking = container.resolve<Locking>(Modules.LOCKING)
  } catch {
    locking = null
  }

  if (locking) {
    try {
      await locking.acquire(lockKey, { expire: LOCK_EXPIRE_SECONDS, ownerId })
    } catch {
      logger.info(`[${job}] skipped, a run is already in progress`)
      return null
    }
  }

  const jobRun = await connector.startJobRun({ job, trigger })
  logger.info(`[${job}] starting`)

  try {
    const stats = await run()
    logger.info(`[${job}] job succeeded`)
    return await connector.finishJobRun(jobRun.id, { stats })
  } catch (error) {
    // Workflow errors arrive serialized, as plain objects with a message.
    const raw = (error as { message?: unknown } | null)?.message
    const message = typeof raw === "string" ? raw : String(error)
    logger.error(`[${job}] failed: ${message}`)
    return await connector.finishJobRun(jobRun.id, { error: message })
  } finally {
    if (locking) {
      await locking.release(lockKey, { ownerId }).catch(() => null)
    }
  }
}
