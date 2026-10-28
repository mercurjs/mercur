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
    IPayoutModuleService,
    OnboardingDTO,
    PayoutAccountDTO,
    PayoutAccountRequirements,
    PayoutAccountStatus,
    PayoutDTO,
    PayoutKycStatus,
    PayoutModuleOptions,
    PayoutOutput,
    PayoutProviderErrorCode,
    PayoutReversalDTO,
    PayoutStatus,
    PayoutStatusReason,
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
import { Context, DAL } from "@medusajs/framework/types"
import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"

type InjectedDependencies = {
    payoutProviderService: PayoutProviderService
    baseRepository: DAL.RepositoryService
}

type ProviderAccount = { external_id?: string | null; data?: Record<string, unknown> | null }

type ProviderResult = {
    status: PayoutStatus
    status_reason: string | null
    data: Record<string, unknown>
}

export default class PayoutModuleService
    extends MedusaService<{
        Onboarding: { dto: OnboardingDTO }
        Payout: { dto: PayoutDTO }
        PayoutAccount: { dto: PayoutAccountDTO }
        PayoutReversal: { dto: PayoutReversalDTO }
    }>({
        Onboarding,
        Payout,
        PayoutAccount,
        PayoutReversal,
    })
    implements IPayoutModuleService
{
    protected static readonly PROCESSABLE_STATUSES = [PayoutStatus.PENDING, PayoutStatus.FAILED]
    protected static readonly STATUS_DETAIL_MAX_LENGTH = 1024

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

    @InjectManager()
    @EmitEvents()
    async syncPayoutAccount(
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
                ...(providerAccount.details_submitted
                    ? { onboarding_token: null, onboarding_token_issued_at: null }
                    : {}),
            },
            sharedContext
        )

        return await this.baseRepository_.serialize<PayoutAccountDTO>(updated)
    }

    @InjectManager()
    @EmitEvents()
    async deletePayoutAccount(
        accountId: string,
        @MedusaContext() sharedContext?: Context<SqlEntityManager>
    ): Promise<void> {
        const account = await this.retrievePayoutAccount(accountId, { relations: ["onboarding"] }, sharedContext)

        if (account.external_id) {
            await this.payoutProviderService_.deleteAccount({ account: this.providerAccountRef_(account) })
        }

        if (account.onboarding) {
            await this.deleteOnboardings(account.onboarding.id, sharedContext)
        }
        await this.deletePayoutAccounts(accountId, sharedContext)
    }

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
            const token =
                input.rotate_token || !this.isOnboardingTokenValid_(account)
                    ? this.generateOnboardingToken_()
                    : (account.onboarding_token as string)
            if (token !== account.onboarding_token) {
                await this.updatePayoutAccounts(
                    { id: account.id, onboarding_token: token, onboarding_token_issued_at: new Date() },
                    sharedContext
                )
            }

            const link = await this.payoutProviderService_.createOnboarding({
                context: { ...input.context, idempotency_key: input.account_id },
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
                      account_id: input.account_id,
                      data,
                      context: (input.context ?? null) as Record<string, unknown> | null,
                  },
                  sharedContext
              )

        return await this.baseRepository_.serialize<OnboardingDTO>(onboarding)
    }

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
                { id: payout.id, ...result, data: { ...(payout.data ?? {}), ...attempt, ...result.data } },
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
                { id: reversal.id, ...result, data: { ...(reversal.data ?? {}), ...attempt, ...result.data } },
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
    ): Promise<{ payout: PayoutDTO; attempt: { attempts: number; idempotency_key: string } | null }> {
        await this.lockRow_("payout", payoutId, sharedContext)

        const payout = await this.retrievePayout(payoutId, { relations: ["account"] }, sharedContext)
        if (!PayoutModuleService.PROCESSABLE_STATUSES.includes(payout.status)) {
            return { payout, attempt: null }
        }

        const attempt = this.nextAttempt_(payout.id, payout.data)
        await this.updatePayouts(
            { id: payout.id, status: PayoutStatus.PROCESSING, data: { ...(payout.data ?? {}), ...attempt } },
            sharedContext
        )

        return { payout, attempt }
    }

    @InjectTransactionManager()
    protected async processPayoutReversal_(
        reversalId: string,
        @MedusaContext() sharedContext: Context<SqlEntityManager> = {}
    ): Promise<{ reversal: PayoutReversalDTO; attempt: { attempts: number; idempotency_key: string } | null }> {
        await this.lockRow_("payout_reversal", reversalId, sharedContext)

        const reversal = await this.retrievePayoutReversal(reversalId, { relations: ["payout"] }, sharedContext)
        if (!PayoutModuleService.PROCESSABLE_STATUSES.includes(reversal.status)) {
            return { reversal, attempt: null }
        }

        const attempt = this.nextAttempt_(reversal.id, reversal.data)
        await this.updatePayoutReversals(
            {
                id: reversal.id,
                status: PayoutStatus.PROCESSING,
                data: { ...(reversal.data ?? {}), ...attempt },
            },
            sharedContext
        )

        return { reversal, attempt }
    }

    // Runs outside the transaction so the row lock is never held across the provider call.
    protected async processPayoutFromProvider_(
        payout: PayoutDTO,
        attempt: { idempotency_key: string }
    ): Promise<ProviderResult> {
        const source = (payout.data?.source_payment ?? null) as { id: string; data: Record<string, unknown> } | null

        try {
            const response = await this.payoutProviderService_.createPayout({
                account: this.providerAccountRef_(payout.account ?? {}),
                amount: payout.amount,
                currency_code: payout.currency_code,
                source_payment: source,
                group: payout.order_id,
                metadata: {
                    payout_id: payout.id,
                    ...(payout.order_id ? { order_id: payout.order_id } : {}),
                },
                context: { idempotency_key: attempt.idempotency_key },
            })

            return this.statusFromProvider_(response)
        } catch (error) {
            return this.statusFromError_(error)
        }
    }

    protected async processPayoutReversalFromProvider_(
        reversal: PayoutReversalDTO,
        attempt: { idempotency_key: string }
    ): Promise<ProviderResult> {
        const payout = reversal.payout as PayoutDTO
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
                context: { idempotency_key: attempt.idempotency_key },
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

    /**
     * The key of a request whose outcome is unknown is kept, so a retry after a
     * timeout returns the payout the provider may already have made. Only a
     * provider refusal clears it, and the next attempt gets a fresh key.
     */
    protected nextAttempt_(id: string, data: Record<string, unknown> | null) {
        const attempts = Number(data?.attempts ?? 0) + 1
        const kept = data?.idempotency_key as string | null | undefined

        return {
            attempts,
            idempotency_key: kept ?? (attempts === 1 ? id : `${id}:${attempts}`),
        }
    }

    protected statusFromProvider_(response: PayoutOutput): ProviderResult {
        return {
            status: response.status,
            status_reason: null,
            data: { provider: { ...response.data, id: response.id }, status_detail: null },
        }
    }

    protected statusFromError_(error: unknown): ProviderResult {
        const code = this.providerErrorCode_(error)
        const message = error instanceof Error ? error.message : String(error)

        return {
            status: code === PayoutProviderErrorCode.FINAL ? PayoutStatus.ABORTED : PayoutStatus.FAILED,
            status_reason: PayoutStatusReason.PROVIDER_ERROR,
            data: {
                status_detail: message.slice(0, PayoutModuleService.STATUS_DETAIL_MAX_LENGTH),
                ...(code === PayoutProviderErrorCode.REFUSED ? { idempotency_key: null } : {}),
            },
        }
    }

    // Read structurally: the error may come from another copy of @mercurjs/types.
    protected providerErrorCode_(error: unknown): PayoutProviderErrorCode {
        const { code, final } = (error ?? {}) as { code?: unknown; final?: unknown }
        if (final === true || code === PayoutProviderErrorCode.FINAL) {
            return PayoutProviderErrorCode.FINAL
        }

        return code === PayoutProviderErrorCode.REFUSED ? PayoutProviderErrorCode.REFUSED : PayoutProviderErrorCode.UNKNOWN
    }

    protected isOnboardingTokenValid_(account: PayoutAccountDTO) {
        if (!account.onboarding_token || !account.onboarding_token_issued_at) {
            return false
        }

        const issuedAt = new Date(account.onboarding_token_issued_at).getTime()
        return Date.now() - issuedAt < this.options_.onboarding.tokenTtlSeconds * 1000
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
