import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { SellerStatus } from "@mercurjs/types"
import { ensureSellerPayoutAccountWorkflow } from "@mercurjs/core/workflows"

import { resolveConnector } from "../../utils/payout-module"
import { JobStats } from "../../utils/run-job"
import { setCheckpointStep } from "../common/steps/set-checkpoint"

export const ONBOARDING_CHECKPOINT = "onboarding"
const PAGE = 100

export type SyncOnboardingWorkflowInput = {
  seller_ids?: string[]
}

const prepareSellerAccountsStep = createStep(
  "prepare-stripe-seller-accounts",
  async (input: SyncOnboardingWorkflowInput, { container }) => {
    const connector = resolveConnector(container)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const stats: Record<string, number | string> = {}

    if (!connector.getOptions().onboarding.enabled) {
      stats.skipped = "onboarding disabled"
      return new StepResponse({ checkpoint: null as string | null, stats })
    }

    const previous = input.seller_ids ? null : await connector.getCheckpoint(ONBOARDING_CHECKPOINT)
    const filters: Record<string, unknown> = {
      status: [SellerStatus.OPEN, SellerStatus.PENDING_APPROVAL],
      ...(input.seller_ids ? { id: input.seller_ids } : {}),
      ...(previous ? { updated_at: { $gt: new Date(previous) } } : {}),
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id", "updated_at"],
      filters,
      pagination: { take: PAGE, order: { updated_at: "ASC" } },
    })

    let processed = 0
    let failed = 0
    for (const seller of sellers) {
      const { errors } = await ensureSellerPayoutAccountWorkflow(container).run({
        input: { seller_id: seller.id },
        throwOnError: false,
      })
      if (errors?.length) {
        failed += 1
        logger.error(`Could not prepare payout account for seller ${seller.id}: ${errors[0].error?.message}`)
      } else {
        processed += 1
      }
    }

    Object.assign(stats, { sellers: sellers.length, processed, failed })
    const newest = sellers.length ? new Date(sellers[sellers.length - 1].updated_at).toISOString() : null

    return new StepResponse({ checkpoint: input.seller_ids ? null : newest, stats })
  }
)

export const syncOnboardingWorkflowId = "sync-stripe-onboarding"

/** Sellers touched since the last run get a provider account and a published onboarding link. */
export const syncOnboardingWorkflow = createWorkflow(
  syncOnboardingWorkflowId,
  function (input: SyncOnboardingWorkflowInput) {
    const prepared = prepareSellerAccountsStep(input)

    const checkpoint = transform({ prepared }, ({ prepared }) => ({
      key: ONBOARDING_CHECKPOINT,
      value: prepared.checkpoint,
    }))
    setCheckpointStep(checkpoint)

    const stats = transform({ prepared }, ({ prepared }): JobStats => ({
      ...prepared.stats,
      ...(prepared.checkpoint ? { checkpoint: prepared.checkpoint } : {}),
    }))

    return new WorkflowResponse(stats)
  }
)
