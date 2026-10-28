import { Context, DAL } from "@medusajs/framework/types"
import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils"
import { PayoutStatus } from "@mercurjs/types"
import Stripe from "stripe"

import { getSmallestUnit } from "../../lib/amounts"
import { getStripeClient } from "../../lib/stripe-client"
import { isDefinitiveStripeRefusal } from "../../lib/stripe-errors"
import {
  AdjustmentDTO,
  AdjustmentType,
  CaptureDTO,
  ConnectorCheckpointDTO,
  ConnectorNotificationDTO,
  JobRunDTO,
  JobRunStatus,
  JobTrigger,
  ResolvedStripeConnectorOptions,
  SettlementDTO,
  SettlementLineDTO,
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

export type CreateSettlementWithLinesDTO = Omit<
  SettlementDTO,
  "id" | "display_id" | "provider_payout_id" | "data" | "created_at" | "updated_at"
> & {
  lines: Pick<SettlementLineDTO, "type" | "amount" | "payout_id" | "payout_reversal_id" | "adjustment_id">[]
}

type ProviderOutcome = {
  status: PayoutStatus
  status_reason: string | null
  provider_id?: string
  data?: Record<string, unknown>
}

type Attempt<T> = { row: T; attempt: number | null }

export default class StripeConnectorModuleService extends MedusaService<{
  Adjustment: { dto: AdjustmentDTO }
  StripeCapture: { dto: CaptureDTO }
  ConnectorCheckpoint: { dto: ConnectorCheckpointDTO }
  ConnectorJobRun: { dto: JobRunDTO }
  ConnectorNotification: { dto: ConnectorNotificationDTO }
  Settlement: { dto: SettlementDTO }
  SettlementLine: { dto: SettlementLineDTO }
}>({
  Adjustment,
  StripeCapture,
  ConnectorCheckpoint,
  ConnectorJobRun,
  ConnectorNotification,
  Settlement,
  SettlementLine,
}) {
  protected static readonly STATUS_REASON_MAX_LENGTH = 1024
  protected static readonly PROCESSABLE_STATUSES = [PayoutStatus.PENDING, PayoutStatus.FAILED, PayoutStatus.ON_HOLD]
  static readonly INSUFFICIENT_BALANCE_REASON = "insufficient_available_balance"

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

  protected stripe_(): Stripe {
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
    return this.stripe_().webhooks.constructEvent(rawData, signature, this.options_.webhookSecret)
  }

  @InjectManager()
  async getCheckpoint(
    key: string,
    @MedusaContext() sharedContext?: Context<SqlEntityManager>
  ): Promise<string | null> {
    const [row] = await this.listConnectorCheckpoints({ key }, {}, sharedContext)
    return row?.value ?? null
  }

  @InjectManager()
  async setCheckpoint(
    key: string,
    value: string | null,
    @MedusaContext() sharedContext?: Context<SqlEntityManager>
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
    @MedusaContext() sharedContext?: Context<SqlEntityManager>
  ): Promise<JobRunDTO> {
    return await this.createConnectorJobRuns(
      {
        job: input.job,
        trigger: input.trigger,
        status: JobRunStatus.RUNNING,
        started_at: new Date(),
      },
      sharedContext
    )
  }

  @InjectManager()
  async finishJobRun(
    runId: string,
    result: { stats?: Record<string, unknown>; error?: string },
    @MedusaContext() sharedContext?: Context<SqlEntityManager>
  ): Promise<JobRunDTO> {
    return await this.updateConnectorJobRuns(
      {
        id: runId,
        status: result.error ? JobRunStatus.FAILED : JobRunStatus.SUCCEEDED,
        finished_at: new Date(),
        stats: result.stats ?? null,
        error: result.error ? this.reason_(result.error) : null,
      },
      sharedContext
    )
  }

  /**
   * Creates each settlement together with its lines, so a settlement never
   * exists without the lines it nets.
   */
  @InjectManager()
  async createSettlementsWithLines(
    data: CreateSettlementWithLinesDTO[],
    @MedusaContext() sharedContext?: Context<SqlEntityManager>
  ): Promise<SettlementDTO[]> {
    if (!data.length) {
      return []
    }
    const ids = await this.createSettlementsWithLines_(data, sharedContext)
    return await this.listSettlements({ id: ids }, { take: null }, sharedContext)
  }

  /**
   * Moves an adjustment between the platform and the connected account: a
   * credit is a transfer to the seller, an invoice or subscription is a
   * transfer from the seller's balance back to the platform.
   */
  @InjectManager()
  async processAdjustment(
    adjustmentId: string,
    stripeAccountId: string,
    @MedusaContext() sharedContext?: Context<SqlEntityManager>
  ): Promise<AdjustmentDTO> {
    const { row, attempt } = await this.processAdjustment_(adjustmentId, sharedContext)

    if (attempt) {
      const outcome = await this.processAdjustmentFromProvider_(row, stripeAccountId, attempt)
      await this.recordAdjustmentOutcome_(adjustmentId, outcome, sharedContext)
    }

    return await this.retrieveAdjustment(adjustmentId, {}, sharedContext)
  }

  /** Pays the settlement out from the connected balance to the seller's bank. */
  @InjectManager()
  async createSettlementPayout(
    settlementId: string,
    stripeAccountId: string,
    @MedusaContext() sharedContext?: Context<SqlEntityManager>
  ): Promise<SettlementDTO> {
    const { row, attempt } = await this.processSettlementPayout_(settlementId, sharedContext)

    if (attempt) {
      const outcome = await this.createSettlementPayoutFromProvider_(row, stripeAccountId, attempt)
      await this.recordSettlementPayoutOutcome_(settlementId, outcome, sharedContext)
    }

    return await this.retrieveSettlement(settlementId, {}, sharedContext)
  }

  @InjectManager()
  async applySettlementPayoutEvent(
    providerPayoutId: string,
    status: Stripe.Payout["status"],
    reason: string | null,
    @MedusaContext() sharedContext?: Context<SqlEntityManager>
  ): Promise<SettlementDTO | null> {
    const [settlement] = await this.listSettlements(
      { provider_payout_id: providerPayoutId },
      {},
      sharedContext
    )
    if (!settlement) {
      return null
    }

    const payoutStatus = this.payoutStatusFromStripe_(status)
    return await this.updateSettlements(
      {
        id: settlement.id,
        payout_status: payoutStatus,
        status: this.settlementStatusFor_(payoutStatus),
        status_reason: payoutStatus === PayoutStatus.FAILED ? reason : null,
      },
      sharedContext
    )
  }

  @InjectTransactionManager()
  protected async createSettlementsWithLines_(
    data: CreateSettlementWithLinesDTO[],
    @MedusaContext() sharedContext: Context<SqlEntityManager> = {}
  ): Promise<string[]> {
    const settlements = await this.createSettlements(
      data.map(({ lines: _lines, ...settlement }) => settlement),
      sharedContext
    )
    await this.createSettlementLines(
      settlements.flatMap((settlement, index) =>
        data[index].lines.map((line) => ({ ...line, settlement_id: settlement.id }))
      ),
      sharedContext
    )
    return settlements.map((settlement) => settlement.id)
  }

  @InjectTransactionManager()
  protected async processAdjustment_(
    adjustmentId: string,
    @MedusaContext() sharedContext: Context<SqlEntityManager> = {}
  ): Promise<Attempt<AdjustmentDTO>> {
    await this.lockRow_("stripe_adjustment", adjustmentId, sharedContext)
    const adjustment = await this.retrieveAdjustment(adjustmentId, {}, sharedContext)

    const attempt = this.nextAttempt_(adjustment.status, adjustment.provider_transfer_id, adjustment.data)
    if (attempt && adjustment.status !== PayoutStatus.PROCESSING) {
      await this.updateAdjustments(
        {
          id: adjustment.id,
          status: PayoutStatus.PROCESSING,
          data: { ...(adjustment.data ?? {}), attempts: attempt },
        },
        sharedContext
      )
    }

    return { row: adjustment, attempt }
  }

  @InjectTransactionManager()
  protected async processSettlementPayout_(
    settlementId: string,
    @MedusaContext() sharedContext: Context<SqlEntityManager> = {}
  ): Promise<Attempt<SettlementDTO>> {
    await this.lockRow_("stripe_settlement", settlementId, sharedContext)
    const settlement = await this.retrieveSettlement(settlementId, {}, sharedContext)

    const attempt = settlement.payout_status
      ? this.nextAttempt_(settlement.payout_status, settlement.provider_payout_id, settlement.data)
      : null
    if (attempt && settlement.payout_status !== PayoutStatus.PROCESSING) {
      await this.updateSettlements(
        {
          id: settlement.id,
          payout_status: PayoutStatus.PROCESSING,
          status: SettlementStatus.OPEN,
          data: { ...(settlement.data ?? {}), attempts: attempt },
        },
        sharedContext
      )
    }

    return { row: settlement, attempt }
  }

  @InjectTransactionManager()
  protected async recordAdjustmentOutcome_(
    adjustmentId: string,
    outcome: ProviderOutcome | string,
    @MedusaContext() sharedContext: Context<SqlEntityManager> = {}
  ): Promise<void> {
    await this.lockRow_("stripe_adjustment", adjustmentId, sharedContext)
    const adjustment = await this.retrieveAdjustment(adjustmentId, {}, sharedContext)
    if (adjustment.status !== PayoutStatus.PROCESSING) {
      return
    }

    if (typeof outcome === "string") {
      await this.updateAdjustments({ id: adjustmentId, status_reason: outcome }, sharedContext)
      return
    }

    await this.updateAdjustments(
      {
        id: adjustmentId,
        status: outcome.status,
        status_reason: outcome.status_reason,
        ...(outcome.provider_id ? { provider_transfer_id: outcome.provider_id } : {}),
      },
      sharedContext
    )
  }

  @InjectTransactionManager()
  protected async recordSettlementPayoutOutcome_(
    settlementId: string,
    outcome: ProviderOutcome | string,
    @MedusaContext() sharedContext: Context<SqlEntityManager> = {}
  ): Promise<void> {
    await this.lockRow_("stripe_settlement", settlementId, sharedContext)
    const settlement = await this.retrieveSettlement(settlementId, {}, sharedContext)
    if (settlement.payout_status !== PayoutStatus.PROCESSING || settlement.provider_payout_id) {
      return
    }

    if (typeof outcome === "string") {
      await this.updateSettlements({ id: settlementId, status_reason: outcome }, sharedContext)
      return
    }

    await this.updateSettlements(
      {
        id: settlementId,
        payout_status: outcome.status,
        status: this.settlementStatusFor_(outcome.status),
        status_reason: outcome.status_reason,
        ...(outcome.provider_id ? { provider_payout_id: outcome.provider_id } : {}),
        ...(outcome.data ? { data: { ...(settlement.data ?? {}), provider: outcome.data } } : {}),
      },
      sharedContext
    )
  }

  // Runs outside the transaction so the row lock is never held across the Stripe call.
  // A string result is a transient error: the row stays processing and the next
  // run resends with the same idempotency key.
  protected async processAdjustmentFromProvider_(
    adjustment: AdjustmentDTO,
    stripeAccountId: string,
    attempt: number
  ): Promise<ProviderOutcome | string> {
    const amount = getSmallestUnit(adjustment.amount, adjustment.currency_code)
    const metadata = { adjustment_id: adjustment.id, account_id: adjustment.account_id }
    const idempotencyKey = this.idempotencyKey_(adjustment.id, attempt)

    try {
      const stripe = this.stripe_()
      let transfer: Stripe.Transfer
      if (adjustment.type === AdjustmentType.EXTRA_CREDIT) {
        transfer = await stripe.transfers.create(
          { amount, currency: adjustment.currency_code, destination: stripeAccountId, metadata },
          { idempotencyKey }
        )
      } else {
        const platform = await stripe.accounts.retrieve()
        transfer = await stripe.transfers.create(
          { amount, currency: adjustment.currency_code, destination: platform.id, metadata },
          { idempotencyKey, stripeAccount: stripeAccountId }
        )
      }
      return { status: PayoutStatus.PAID, status_reason: null, provider_id: transfer.id }
    } catch (error) {
      return this.outcomeFromError_(error)
    }
  }

  protected async createSettlementPayoutFromProvider_(
    settlement: SettlementDTO,
    stripeAccountId: string,
    attempt: number
  ): Promise<ProviderOutcome | string> {
    const currency = settlement.currency_code.toLowerCase()

    try {
      const stripe = this.stripe_()
      const requested = getSmallestUnit(settlement.amount, settlement.currency_code)
      const balance = await stripe.balance.retrieve({}, { stripeAccount: stripeAccountId })
      const available = balance.available.find((entry) => entry.currency === currency)?.amount ?? 0

      if (available < requested) {
        return {
          status: PayoutStatus.ON_HOLD,
          status_reason: StripeConnectorModuleService.INSUFFICIENT_BALANCE_REASON,
        }
      }

      const payout = await stripe.payouts.create(
        { amount: requested, currency, metadata: { settlement_id: settlement.id } },
        { idempotencyKey: this.idempotencyKey_(settlement.id, attempt), stripeAccount: stripeAccountId }
      )

      return {
        status: this.payoutStatusFromStripe_(payout.status),
        status_reason: null,
        provider_id: payout.id,
        data: { ...payout },
      }
    } catch (error) {
      return this.outcomeFromError_(error)
    }
  }

  protected outcomeFromError_(error: unknown): ProviderOutcome | string {
    const reason = this.reason_(error instanceof Error ? error.message : String(error))
    return isDefinitiveStripeRefusal(error) ? { status: PayoutStatus.FAILED, status_reason: reason } : reason
  }

  // A processing row without a provider id was sent but its outcome is unknown,
  // so it is resent with the key of that attempt. Any other retry follows a
  // definitive refusal, which Stripe caches against the key, so it needs a new one.
  protected nextAttempt_(
    status: PayoutStatus,
    providerId: string | null,
    data: Record<string, unknown> | null
  ): number | null {
    const attempts = Number(data?.attempts ?? 0)
    if (status === PayoutStatus.PROCESSING) {
      return providerId ? null : Math.max(attempts, 1)
    }
    return StripeConnectorModuleService.PROCESSABLE_STATUSES.includes(status) ? attempts + 1 : null
  }

  protected async lockRow_(table: string, id: string, sharedContext: Context<SqlEntityManager>) {
    // A FOR UPDATE on a pooled (autocommit) connection would release the lock
    // immediately, so require the transaction context.
    const knex = sharedContext.transactionManager?.getTransactionContext()
    if (!knex) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Processing ${table} ${id} must run inside a transaction.`
      )
    }

    await knex.raw("SET LOCAL lock_timeout = '3s'")
    await knex(table).where("id", id).forUpdate().select("id")
  }

  protected idempotencyKey_(id: string, attempt: number) {
    return attempt === 1 ? id : `${id}:${attempt}`
  }

  protected reason_(message: string) {
    return message.slice(0, StripeConnectorModuleService.STATUS_REASON_MAX_LENGTH)
  }

  protected settlementStatusFor_(payoutStatus: PayoutStatus): SettlementStatus {
    switch (payoutStatus) {
      case PayoutStatus.PAID:
        return SettlementStatus.PAID_OUT
      case PayoutStatus.FAILED:
      case PayoutStatus.ON_HOLD:
        return SettlementStatus.FAILED
      default:
        return SettlementStatus.OPEN
    }
  }

  protected payoutStatusFromStripe_(status: Stripe.Payout["status"]): PayoutStatus {
    switch (status) {
      case "paid":
        return PayoutStatus.PAID
      case "failed":
      case "canceled":
        return PayoutStatus.FAILED
      default:
        return PayoutStatus.PROCESSING
    }
  }
}
