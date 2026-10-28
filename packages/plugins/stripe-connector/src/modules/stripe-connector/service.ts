import { Context, DAL, InferEntityType } from "@medusajs/framework/types"
import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import {
  InjectManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils"
import { PayoutStatus } from "@mercurjs/types"
import Stripe from "stripe"

import { getSmallestUnit } from "../../lib/amounts"
import { getStripeClient } from "../../lib/stripe-client"
import {
  AdjustmentDTO,
  AdjustmentType,
  JobRunDTO,
  JobRunStatus,
  JobTrigger,
  ResolvedStripeConnectorOptions,
  SettlementDTO,
  SettlementStatus,
  StripeConnectorPluginOptions,
  resolveStripeConnectorOptions,
} from "../../types/common"
import {
  Adjustment,
  StripeCapture,
  ConnectorCheckpoint,
  ConnectorJobRun,
  ConnectorNotification,
  Settlement,
  SettlementLine,
} from "./models"

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService
}

const REASON_MAX_LENGTH = 1024
const DISPATCHABLE = [PayoutStatus.PENDING, PayoutStatus.FAILED, PayoutStatus.ON_HOLD]

const errorReason = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, REASON_MAX_LENGTH)
}

const idempotencyKey = (id: string, attempt: number) => (attempt === 1 ? id : `${id}:${attempt}`)

export const settlementStatusFor = (payoutStatus: PayoutStatus): SettlementStatus =>
  payoutStatus === PayoutStatus.PAID
    ? SettlementStatus.PAID_OUT
    : payoutStatus === PayoutStatus.FAILED || payoutStatus === PayoutStatus.ON_HOLD
      ? SettlementStatus.FAILED
      : SettlementStatus.OPEN

const payoutStatusFromStripe = (status: Stripe.Payout["status"]): PayoutStatus =>
  status === "paid"
    ? PayoutStatus.PAID
    : status === "failed" || status === "canceled"
      ? PayoutStatus.FAILED
      : PayoutStatus.PROCESSING

export default class StripeConnectorModuleService extends MedusaService({
  Adjustment,
  StripeCapture,
  ConnectorCheckpoint,
  ConnectorJobRun,
  ConnectorNotification,
  Settlement,
  SettlementLine,
}) {
  protected readonly baseRepository_: DAL.RepositoryService
  protected readonly options_: ResolvedStripeConnectorOptions

  constructor({ baseRepository }: InjectedDependencies, options: StripeConnectorPluginOptions) {
    // @ts-ignore
    super(...arguments)
    this.baseRepository_ = baseRepository
    this.options_ = resolveStripeConnectorOptions(options)
  }

  getOptions(): ResolvedStripeConnectorOptions {
    return this.options_
  }

  isConfigured(): boolean {
    return !!this.options_.apiKey
  }

  protected stripe(): Stripe {
    if (!this.options_.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The Stripe connector plugin has no apiKey configured"
      )
    }
    return getStripeClient(this.options_.apiKey)
  }

  /**
   * Verifies a Connect webhook with the plugin's signing secret. Returns null
   * when the plugin has no secret configured.
   */
  constructWebhookEvent(rawData: string | Buffer, signature: string): Stripe.Event | null {
    if (!this.options_.apiKey || !this.options_.webhookSecret) {
      return null
    }
    return this.stripe().webhooks.constructEvent(rawData, signature, this.options_.webhookSecret)
  }

  @InjectManager()
  async getCheckpoint(
    key: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<string | null> {
    const [row] = await this.listConnectorCheckpoints({ key }, {}, sharedContext)
    return row?.value ?? null
  }

  @InjectManager()
  async setCheckpoint(
    key: string,
    value: string | null,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<void> {
    const [row] = await this.listConnectorCheckpoints({ key }, {}, sharedContext)
    if (row) {
      await this.updateConnectorCheckpoints({ id: row.id, value }, sharedContext)
    } else {
      await this.createConnectorCheckpoints({ key, value }, sharedContext)
    }
  }

  @InjectManager()
  async startJobRun(
    input: { job: string; trigger: JobTrigger },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<JobRunDTO> {
    const run = await this.createConnectorJobRuns(
      {
        job: input.job,
        trigger: input.trigger,
        status: JobRunStatus.RUNNING,
        started_at: new Date(),
      },
      sharedContext
    )
    return await this.baseRepository_.serialize<JobRunDTO>(run)
  }

  @InjectManager()
  async finishJobRun(
    runId: string,
    result: { stats?: Record<string, unknown>; error?: string },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<JobRunDTO> {
    const run = await this.updateConnectorJobRuns(
      {
        id: runId,
        status: result.error ? JobRunStatus.FAILED : JobRunStatus.SUCCEEDED,
        finished_at: new Date(),
        stats: result.stats ?? null,
        error: result.error ? result.error.slice(0, REASON_MAX_LENGTH) : null,
      },
      sharedContext
    )
    return await this.baseRepository_.serialize<JobRunDTO>(run)
  }

  /**
   * Moves an adjustment between the platform and the connected account: a
   * credit is a transfer to the seller, an invoice or subscription is a
   * transfer from the seller's balance back to the platform.
   */
  @InjectManager()
  async dispatchAdjustment(
    adjustmentId: string,
    stripeAccountId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<AdjustmentDTO> {
    const adjustment = await this.retrieveAdjustment(adjustmentId, {}, sharedContext)

    if (!DISPATCHABLE.includes(adjustment.status)) {
      return await this.baseRepository_.serialize<AdjustmentDTO>(adjustment)
    }

    const attempt = Number(adjustment.data?.attempts ?? 0) + 1
    const amount = getSmallestUnit(adjustment.amount, adjustment.currency_code)
    const metadata = { adjustment_id: adjustment.id, account_id: adjustment.account_id }

    let updated: InferEntityType<typeof Adjustment>
    try {
      const stripe = this.stripe()
      let transfer: Stripe.Transfer
      if (adjustment.type === AdjustmentType.EXTRA_CREDIT) {
        transfer = await stripe.transfers.create(
          { amount, currency: adjustment.currency_code, destination: stripeAccountId, metadata },
          { idempotencyKey: idempotencyKey(adjustment.id, attempt) }
        )
      } else {
        const platform = await stripe.accounts.retrieve()
        transfer = await stripe.transfers.create(
          { amount, currency: adjustment.currency_code, destination: platform.id, metadata },
          { idempotencyKey: idempotencyKey(adjustment.id, attempt), stripeAccount: stripeAccountId }
        )
      }

      updated = await this.updateAdjustments(
        {
          id: adjustment.id,
          status: PayoutStatus.PAID,
          status_reason: null,
          provider_transfer_id: transfer.id,
          data: { ...(adjustment.data ?? {}), attempts: attempt },
        },
        sharedContext
      )
    } catch (error) {
      updated = await this.updateAdjustments(
        {
          id: adjustment.id,
          status: PayoutStatus.FAILED,
          status_reason: errorReason(error),
          data: { ...(adjustment.data ?? {}), attempts: attempt },
        },
        sharedContext
      )
    }

    return await this.baseRepository_.serialize<AdjustmentDTO>(updated)
  }

  /**
   * Pays the settlement out from the connected balance to the seller's bank.
   * When the balance holds another currency (the transfers settled in the
   * platform's balance currency), or not enough of this one, the largest
   * available balance is paid out instead.
   */
  @InjectManager()
  async dispatchSettlementPayout(
    settlementId: string,
    stripeAccountId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<SettlementDTO> {
    const settlement = await this.retrieveSettlement(settlementId, {}, sharedContext)

    if (!settlement.payout_status || !DISPATCHABLE.includes(settlement.payout_status)) {
      return await this.baseRepository_.serialize<SettlementDTO>(settlement)
    }

    const attempt = Number(settlement.data?.attempts ?? 0) + 1
    const data = { ...(settlement.data ?? {}), attempts: attempt }

    let updated: InferEntityType<typeof Settlement>
    try {
      const stripe = this.stripe()
      const requested = getSmallestUnit(settlement.amount, settlement.currency_code)
      const balance = await stripe.balance.retrieve({}, { stripeAccount: stripeAccountId })
      const inRequested = balance.available.find(
        (b) => b.currency === settlement.currency_code.toLowerCase()
      )

      let amount = requested
      let currency = settlement.currency_code
      if (!inRequested || inRequested.amount < requested) {
        const candidate = balance.available
          .filter((b) => b.amount > 0)
          .sort((a, b) => b.amount - a.amount)[0]
        if (!candidate) {
          throw new Error(
            `No available balance on ${stripeAccountId} to pay out ${String(settlement.amount)} ${settlement.currency_code}`
          )
        }
        amount = candidate.amount
        currency = candidate.currency
      }

      const payout = await stripe.payouts.create(
        {
          amount,
          currency,
          metadata: {
            settlement_id: settlement.id,
            requested_amount: String(settlement.amount),
            requested_currency: settlement.currency_code,
          },
        },
        { idempotencyKey: idempotencyKey(settlement.id, attempt), stripeAccount: stripeAccountId }
      )

      const payoutStatus = payoutStatusFromStripe(payout.status)
      updated = await this.updateSettlements(
        {
          id: settlement.id,
          payout_status: payoutStatus,
          status: settlementStatusFor(payoutStatus),
          provider_payout_id: payout.id,
          status_reason: null,
          data: { ...data, provider: payout as unknown as Record<string, unknown> },
        },
        sharedContext
      )
    } catch (error) {
      updated = await this.updateSettlements(
        {
          id: settlement.id,
          payout_status: PayoutStatus.FAILED,
          status: SettlementStatus.FAILED,
          status_reason: errorReason(error),
          data,
        },
        sharedContext
      )
    }

    return await this.baseRepository_.serialize<SettlementDTO>(updated)
  }

  @InjectManager()
  async applySettlementPayoutEvent(
    providerPayoutId: string,
    status: Stripe.Payout["status"],
    reason: string | null,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<SettlementDTO | null> {
    const [settlement] = await this.listSettlements(
      { provider_payout_id: providerPayoutId },
      {},
      sharedContext
    )
    if (!settlement) {
      return null
    }

    const payoutStatus = payoutStatusFromStripe(status)
    const updated = await this.updateSettlements(
      {
        id: settlement.id,
        payout_status: payoutStatus,
        status: settlementStatusFor(payoutStatus),
        status_reason: payoutStatus === PayoutStatus.FAILED ? reason : null,
      },
      sharedContext
    )
    return await this.baseRepository_.serialize<SettlementDTO>(updated)
  }
}
