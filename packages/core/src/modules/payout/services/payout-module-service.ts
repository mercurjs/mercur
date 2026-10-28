import {
    EmitEvents,
    InjectManager,
    InjectTransactionManager,
    MedusaContext,
    MedusaError,
    MedusaService,
} from "@medusajs/framework/utils"
import {
    AccountOutput,
    CreateAccountInput,
    CreatePayoutAccountDTO,
    CreateOnboardingDTO,
    OnboardingDTO,
    PayoutAccountDTO,
    PayoutAccountRequirements,
    PayoutAccountStatus,
    PayoutDTO,
    PayoutKycStatus,
    PayoutModuleOptions,
    PayoutOutput,
    PayoutReversalDTO,
    PayoutStatus,
    PayoutWebhookActionInput,
    PayoutWebhookResult,
    ResolvedPayoutModuleOptions,
    resolvePayoutModuleOptions,
} from "@mercurjs/types"
import PayoutProviderService from "./provider-service"
import {
    Onboarding,
    Payout,
    PayoutAccount,
    PayoutReversal,
} from "../models"
import { Context, DAL, InferEntityType } from "@medusajs/framework/types"
import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"

type InjectedDependencies = {
    payoutProviderService: PayoutProviderService
    baseRepository: DAL.RepositoryService
}

type ProviderAccount = { external_id?: string | null; data?: Record<string, unknown> | null }

export default class PayoutModuleService extends MedusaService({
    Onboarding,
    Payout,
    PayoutAccount,
    PayoutReversal,
}) {
    protected static readonly PROCESSABLE_STATUSES = [PayoutStatus.PENDING, PayoutStatus.FAILED]
    protected static readonly STATUS_REASON_MAX_LENGTH = 1024

    protected readonly payoutProviderService_: PayoutProviderService
    protected readonly baseRepository_: DAL.RepositoryService
    protected readonly options_: ResolvedPayoutModuleOptions

    constructor({ payoutProviderService, baseRepository }: InjectedDependencies, options: PayoutModuleOptions) {
        // @ts-ignore
        super(...arguments)
        this.payoutProviderService_ = payoutProviderService
        this.baseRepository_ = baseRepository
        this.options_ = resolvePayoutModuleOptions(options)
    }

    getOptions(): ResolvedPayoutModuleOptions {
        return this.options_
    }

    @InjectManager()
    @EmitEvents()
    async createPayoutAccount(
        input: CreatePayoutAccountDTO,
        @MedusaContext() sharedContext?: Context<SqlEntityManager>
    ): Promise<PayoutAccountDTO> {
        const payoutAccount = await this.createPayoutAccounts(
            { data: input.data ?? {}, context: (input.context ?? null) as Record<string, unknown> | null },
            sharedContext
        )

        let providerAccount: AccountOutput
        try {
            providerAccount = await this.payoutProviderService_.createAccount(
                this.providerAccountInput_(payoutAccount.id, input)
            )
        } catch (error) {
            await this.deletePayoutAccounts(payoutAccount.id, sharedContext)
            throw error
        }

        const updated = await this.updatePayoutAccounts(
            { id: payoutAccount.id, ...this.accountFieldsFromProvider_(providerAccount) },
            sharedContext
        )

        return await this.baseRepository_.serialize<PayoutAccountDTO>(updated)
    }

    /**
     * Pulls the account from the provider and stores its flags and KYC status.
     */
    @InjectManager()
    @EmitEvents()
    async updatePayoutAccount(
        accountId: string,
        @MedusaContext() sharedContext?: Context<SqlEntityManager>
    ): Promise<PayoutAccountDTO> {
        const account = await this.retrievePayoutAccount(accountId, {}, sharedContext)

        const providerAccount = await this.payoutProviderService_.retrieveAccount({
            account: this.providerAccountRef_(account),
        })

        const updated = await this.updatePayoutAccounts(
            {
                id: accountId,
                ...this.accountFieldsFromProvider_(providerAccount),
                onboarding_token: providerAccount.details_submitted ? null : account.onboarding_token,
            },
            sharedContext
        )

        return await this.baseRepository_.serialize<PayoutAccountDTO>(updated)
    }

    /**
     * Publishes the link the seller follows next: an onboarding link until the
     * provider has their details, a dashboard login link afterwards.
     */
    @InjectManager()
    @EmitEvents()
    async createOnboarding(
        input: CreateOnboardingDTO,
        @MedusaContext() sharedContext?: Context<SqlEntityManager>
    ): Promise<OnboardingDTO> {
        const account = await this.retrievePayoutAccount(
            input.account_id,
            { relations: ["onboarding"] },
            sharedContext
        )

        const loginLink = account.details_submitted
            ? await this.payoutProviderService_.createLoginLink({ account: this.providerAccountRef_(account) })
            : null

        let data: Record<string, unknown>
        if (loginLink) {
            data = { ...loginLink.data, url: loginLink.url, kind: "login", expires_at: loginLink.expires_at ?? null }
        } else {
            const token = account.onboarding_token ?? this.generateOnboardingToken_()
            if (!account.onboarding_token) {
                await this.updatePayoutAccounts({ id: account.id, onboarding_token: token }, sharedContext)
            }

            const link = await this.payoutProviderService_.createOnboarding({
                context: { idempotency_key: input.account_id, ...input.context },
                data: { ...account.data, ...input.data },
                account: this.providerAccountRef_(account),
                refresh_url:
                    (input.data?.refresh_url as string | undefined) ??
                    `${this.options_.onboarding.refreshBaseUrl}/payout/onboarding/refresh?token=${token}`,
                return_url: (input.data?.return_url as string | undefined) ?? this.options_.onboarding.returnUrl,
            })
            data = { ...link.data, url: link.url, kind: "onboarding", expires_at: link.expires_at ?? null }
        }

        const onboarding = account.onboarding
            ? await this.updateOnboardings({ id: account.onboarding.id, data }, sharedContext)
            : await this.createOnboardings(
                  {
                      account: input.account_id,
                      data,
                      context: (input.context ?? null) as Record<string, unknown> | null,
                  },
                  sharedContext
              )

        return await this.baseRepository_.serialize<OnboardingDTO>(onboarding)
    }

    /**
     * Sends a pending or failed payout to the provider. A provider error is
     * recorded on the payout instead of thrown, so it can be processed again.
     */
    @InjectManager()
    @EmitEvents()
    async processPayout(
        payoutId: string,
        @MedusaContext() sharedContext?: Context<SqlEntityManager>
    ): Promise<PayoutDTO> {
        const { payout, attempt } = await this.processPayout_(payoutId, sharedContext)

        if (attempt) {
            const result = await this.processPayoutFromProvider_(payout, attempt)
            await this.updatePayouts(
                {
                    id: payout.id,
                    ...result,
                    data: { ...(payout.data ?? {}), attempts: attempt, ...(result.data ?? {}) },
                },
                sharedContext
            )
        }

        const updated = await this.retrievePayout(payoutId, {}, sharedContext)
        return await this.baseRepository_.serialize<PayoutDTO>(updated)
    }

    @InjectManager()
    @EmitEvents()
    async processPayoutReversal(
        reversalId: string,
        @MedusaContext() sharedContext?: Context<SqlEntityManager>
    ): Promise<PayoutReversalDTO> {
        const { reversal, attempt } = await this.processPayoutReversal_(reversalId, sharedContext)

        if (attempt) {
            const result = await this.processPayoutReversalFromProvider_(reversal, attempt)
            await this.updatePayoutReversals(
                {
                    id: reversal.id,
                    ...result,
                    data: { ...(reversal.data ?? {}), attempts: attempt, ...(result.data ?? {}) },
                },
                sharedContext
            )
        }

        const updated = await this.retrievePayoutReversal(reversalId, {}, sharedContext)
        return await this.baseRepository_.serialize<PayoutReversalDTO>(updated)
    }

    async getWebhookActionAndData(input: PayoutWebhookActionInput): Promise<PayoutWebhookResult> {
        return await this.payoutProviderService_.getWebhookActionAndData(input)
    }

    @InjectTransactionManager()
    protected async processPayout_(
        payoutId: string,
        @MedusaContext() sharedContext: Context<SqlEntityManager> = {}
    ): Promise<{ payout: InferEntityType<typeof Payout>; attempt: number | null }> {
        await this.lockRow_("payout", payoutId, sharedContext)

        const payout = await this.retrievePayout(payoutId, { relations: ["account"] }, sharedContext)
        if (!PayoutModuleService.PROCESSABLE_STATUSES.includes(payout.status)) {
            return { payout, attempt: null }
        }

        const attempt = Number(payout.data?.attempts ?? 0) + 1
        await this.updatePayouts(
            { id: payout.id, status: PayoutStatus.PROCESSING, data: { ...(payout.data ?? {}), attempts: attempt } },
            sharedContext
        )

        return { payout, attempt }
    }

    @InjectTransactionManager()
    protected async processPayoutReversal_(
        reversalId: string,
        @MedusaContext() sharedContext: Context<SqlEntityManager> = {}
    ): Promise<{ reversal: InferEntityType<typeof PayoutReversal>; attempt: number | null }> {
        await this.lockRow_("payout_reversal", reversalId, sharedContext)

        const reversal = await this.retrievePayoutReversal(reversalId, { relations: ["payout"] }, sharedContext)
        if (!PayoutModuleService.PROCESSABLE_STATUSES.includes(reversal.status)) {
            return { reversal, attempt: null }
        }

        const attempt = Number(reversal.data?.attempts ?? 0) + 1
        await this.updatePayoutReversals(
            {
                id: reversal.id,
                status: PayoutStatus.PROCESSING,
                data: { ...(reversal.data ?? {}), attempts: attempt },
            },
            sharedContext
        )

        return { reversal, attempt }
    }

    // Runs outside the transaction so the row lock is never held across the provider call.
    protected async processPayoutFromProvider_(payout: InferEntityType<typeof Payout>, attempt: number) {
        const source = (payout.data?.source_payment ?? null) as { id: string; data: Record<string, unknown> } | null

        try {
            const response = await this.payoutProviderService_.createPayout({
                account: this.providerAccountRef_(payout.account),
                amount: payout.amount,
                currency_code: payout.currency_code,
                source_payment: source,
                group: payout.order_id,
                metadata: {
                    payout_id: payout.id,
                    ...(payout.order_id ? { order_id: payout.order_id } : {}),
                },
                context: { idempotency_key: this.idempotencyKey_(payout.id, attempt) },
            })

            return this.statusFromProvider_(response)
        } catch (error) {
            return this.statusFromError_(error)
        }
    }

    protected async processPayoutReversalFromProvider_(
        reversal: InferEntityType<typeof PayoutReversal>,
        attempt: number
    ) {
        const payout = reversal.payout
        const provider = (payout.data?.provider ?? {}) as Record<string, unknown>

        try {
            const response = await this.payoutProviderService_.reversePayout({
                payout: { id: provider.id as string, data: provider },
                amount: reversal.amount,
                currency_code: payout.currency_code,
                metadata: {
                    payout_id: payout.id,
                    payout_reversal_id: reversal.id,
                    ...(reversal.refund_id ? { refund_id: reversal.refund_id } : {}),
                },
                context: { idempotency_key: this.idempotencyKey_(reversal.id, attempt) },
            })

            return this.statusFromProvider_(response)
        } catch (error) {
            return this.statusFromError_(error)
        }
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

    protected statusFromProvider_(response: PayoutOutput) {
        return {
            status: response.status,
            status_reason: null,
            data: { provider: { ...response.data, id: response.id } },
        }
    }

    protected statusFromError_(error: unknown) {
        const message = error instanceof Error ? error.message : String(error)

        return {
            status: (error as { final?: boolean })?.final === true ? PayoutStatus.ABORTED : PayoutStatus.FAILED,
            status_reason: message.slice(0, PayoutModuleService.STATUS_REASON_MAX_LENGTH),
            data: undefined,
        }
    }

    // A provider caches an idempotency key with the request that first used it,
    // so a retry after a refused attempt needs a fresh key.
    protected idempotencyKey_(id: string, attempt: number) {
        return attempt === 1 ? id : `${id}:${attempt}`
    }

    protected generateOnboardingToken_() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("")
    }

    protected providerAccountRef_(account: ProviderAccount) {
        return {
            id: account.external_id ?? ((account.data?.id as string | undefined) ?? ""),
            data: (account.data ?? {}) as Record<string, unknown>,
        }
    }

    protected providerAccountInput_(accountId: string, input: CreatePayoutAccountDTO): CreateAccountInput {
        const seller = input.seller
        const prefill = this.options_.onboarding.prefill && seller

        return {
            context: { idempotency_key: accountId, ...input.context },
            data: { ...input.data, account_id: accountId },
            country:
                (input.data?.country as string | undefined) ??
                seller?.country_code ??
                this.options_.onboarding.defaultCountry ??
                undefined,
            business_type:
                (input.data?.business_type as "individual" | "company" | undefined) ??
                (prefill ? (seller?.is_company ? "company" : "individual") : undefined),
            business_profile: prefill
                ? {
                      name: (input.data?.business_name as string | undefined) ?? seller?.name ?? null,
                      url: (input.data?.website as string | undefined) ?? seller?.website_url ?? null,
                      support_email: (input.data?.support_email as string | undefined) ?? seller?.email ?? null,
                      support_phone: (input.data?.support_phone as string | undefined) ?? seller?.phone ?? null,
                  }
                : undefined,
            metadata: {
                account_id: accountId,
                ...(seller?.id ? { seller_id: seller.id } : {}),
            },
        }
    }

    protected accountFieldsFromProvider_(account: AccountOutput) {
        return {
            external_id: account.id,
            status: this.deriveAccountStatus_(account),
            kyc_status: this.deriveKycStatus_(account.requirements, account.disabled_reason),
            payouts_enabled: account.payouts_enabled,
            charges_enabled: account.charges_enabled,
            details_submitted: account.details_submitted,
            disabled_reason: account.disabled_reason,
            data: account.data,
            last_synced_at: new Date(),
        }
    }

    /**
     * Outstanding requirements beat pending verification, a `rejected.*`
     * disabled reason is final, any other disabled reason is still under review.
     */
    protected deriveKycStatus_(
        requirements: PayoutAccountRequirements | null | undefined,
        disabledReason: string | null | undefined
    ): PayoutKycStatus {
        if (requirements?.currently_due?.length || requirements?.past_due?.length) {
            return PayoutKycStatus.PENDING_SUBMISSION
        }

        if (requirements?.pending_verification?.length) {
            return PayoutKycStatus.PENDING_APPROVAL
        }

        if (disabledReason?.startsWith("rejected")) {
            return PayoutKycStatus.REFUSED
        }

        return disabledReason ? PayoutKycStatus.PENDING_APPROVAL : PayoutKycStatus.APPROVED
    }

    protected deriveAccountStatus_(account: AccountOutput): PayoutAccountStatus {
        if (account.status === PayoutAccountStatus.REJECTED || account.disabled_reason?.startsWith("rejected")) {
            return PayoutAccountStatus.REJECTED
        }

        if (!account.details_submitted) {
            return PayoutAccountStatus.PENDING
        }

        if (account.payouts_enabled && account.charges_enabled && !account.disabled_reason) {
            return PayoutAccountStatus.ACTIVE
        }

        return PayoutAccountStatus.RESTRICTED
    }
}
