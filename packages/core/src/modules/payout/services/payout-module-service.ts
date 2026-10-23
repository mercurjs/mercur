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
    CreatePayoutAccountDTO,
    CreatePayoutDTO,
    CreateOnboardingDTO,
    CreatePayoutJobRunDTO,
    OnboardingDTO,
    PayoutAccountDTO,
    PayoutAccountStatus,
    PayoutDTO,
    PayoutJobRunDTO,
    PayoutJobRunStatus,
    PayoutModuleOptions,
    PayoutProviderDTO,
    PayoutStatus,
    SettlementStatus,
    PayoutWebhookActionInput,
    PayoutWebhookResult,
    ResolvedPayoutModuleOptions,
    TransferDTO,
    TransferStatus,
    TransferType,
    resolvePayoutModuleOptions,
} from "@mercurjs/types"
import PayoutProviderService from "./provider-service"
import {
    Adjustment,
    Onboarding,
    Payout,
    PayoutAccount,
    PayoutCheckpoint,
    PayoutJobRun,
    PayoutNotification,
    PayoutProviderRecord,
    Settlement,
    Transfer,
} from "../models"
import { Context, DAL, InferEntityType } from "@medusajs/framework/types"
import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import { deriveAccountStatus, deriveKycStatus } from "../utils/kyc"

type InjectedDependencies = {
    payoutProviderService: PayoutProviderService
    baseRepository: DAL.RepositoryService
}

const REASON_MAX_LENGTH = 1024

const errorReason = (error: unknown): string => {
    const message = error instanceof Error ? error.message : String(error)
    return message.slice(0, REASON_MAX_LENGTH)
}

export default class PayoutModuleService extends MedusaService({
    Onboarding,
    Payout,
    PayoutAccount,
    Transfer,
    Settlement,
    Adjustment,
    PayoutCheckpoint,
    PayoutJobRun,
    PayoutNotification,
    PayoutProviderRecord,
}) {
    protected readonly payoutProviderService_: PayoutProviderService
    protected readonly baseRepository_: DAL.RepositoryService
    protected readonly options_: ResolvedPayoutModuleOptions
    protected readonly rawOptions_: PayoutModuleOptions

    constructor({ payoutProviderService, baseRepository }: InjectedDependencies, options: PayoutModuleOptions) {
        // @ts-ignore
        super(...arguments)
        this.payoutProviderService_ = payoutProviderService
        this.baseRepository_ = baseRepository
        this.rawOptions_ = options ?? {}
        this.options_ = resolvePayoutModuleOptions(options)
    }

    getOptions(): ResolvedPayoutModuleOptions {
        return this.options_
    }

    listProviderIds(): string[] {
        return this.payoutProviderService_.listProviderIds()
    }

    getDefaultProviderId(): string {
        return this.payoutProviderService_.getDefaultProviderId()
    }

    @InjectManager()
    async listRegisteredPayoutProviders(
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutProviderDTO[]> {
        const registered = this.listProviderIds()
        const rows = await this.listPayoutProviderRecords({}, {}, sharedContext)
        const known = new Set(rows.map((row) => row.id))
        const missing = registered.filter((id) => !known.has(id))

        if (missing.length) {
            await this.createPayoutProviderRecords(
                missing.map((id) => ({ id, is_enabled: true })),
                sharedContext
            )
        }

        const all = await this.listPayoutProviderRecords({ id: registered }, {}, sharedContext)
        return await this.baseRepository_.serialize<PayoutProviderDTO[]>(all)
    }

    protected accountRef(account: { provider_account_id?: string | null; data?: Record<string, unknown> | null }) {
        return {
            id: account.provider_account_id ?? ((account.data?.id as string | undefined) ?? ""),
            data: (account.data ?? {}) as Record<string, unknown>,
        }
    }

    protected accountFieldsFromProvider(account: AccountOutput) {
        return {
            provider_account_id: account.id,
            status: deriveAccountStatus(account),
            kyc_status: deriveKycStatus(account.requirements, account.disabled_reason),
            payouts_enabled: account.payouts_enabled,
            charges_enabled: account.charges_enabled,
            details_submitted: account.details_submitted,
            disabled_reason: account.disabled_reason,
            requirements: account.requirements as unknown as Record<string, unknown>,
            data: account.data,
            last_synced_at: new Date(),
        }
    }

    @InjectManager()
    @EmitEvents()
    async createPayoutAccount(
        input: CreatePayoutAccountDTO,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutAccountDTO> {
        const providerId = input.provider_id ?? this.getDefaultProviderId()
        this.payoutProviderService_.retrieveProvider(providerId)

        let payoutAccount: InferEntityType<typeof PayoutAccount> | null = null
        let providerAccount: AccountOutput | null = null

        try {
            payoutAccount = await this.createPayoutAccounts(
                {
                    provider_id: providerId,
                    data: input.data ?? {},
                    context: input.context as Record<string, unknown>,
                },
                sharedContext
            )

            const seller = input.seller
            const prefill = this.options_.onboarding.prefill && seller
            const country =
                (input.data?.country as string | undefined) ??
                seller?.country_code ??
                this.options_.onboarding.defaultCountry

            providerAccount = await this.payoutProviderService_.createAccount({
                provider_id: providerId,
                context: {
                    idempotency_key: payoutAccount.id,
                    ...input.context,
                },
                data: {
                    ...input.data,
                    account_id: payoutAccount.id,
                },
                country: country ?? undefined,
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
                    account_id: payoutAccount.id,
                    ...(seller?.id ? { seller_id: seller.id } : {}),
                },
                settings: {
                    manual_payouts: this.options_.settlements.mode === "connector",
                },
            })

            payoutAccount = await this.updatePayoutAccounts(
                {
                    id: payoutAccount.id,
                    ...this.accountFieldsFromProvider(providerAccount),
                },
                sharedContext
            )
        } catch (error) {
            if (providerAccount && payoutAccount?.id) {
                await this.updatePayoutAccounts(
                    {
                        id: payoutAccount.id,
                        ...this.accountFieldsFromProvider(providerAccount),
                    },
                    sharedContext
                ).catch(() => null)
            } else if (payoutAccount?.id) {
                await this.deletePayoutAccounts(payoutAccount.id, sharedContext)
            }
            throw error
        }

        return await this.baseRepository_.serialize<PayoutAccountDTO>(payoutAccount)
    }

    @InjectManager()
    @EmitEvents()
    async syncPayoutAccount(
        accountId: string,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutAccountDTO> {
        const account = await this.retrievePayoutAccount(accountId, {}, sharedContext)

        const providerAccount = await this.payoutProviderService_.retrieveAccount({
            provider_id: account.provider_id,
            account: this.accountRef(account),
        })

        const fields = this.accountFieldsFromProvider(providerAccount)
        const updated = await this.updatePayoutAccounts(
            {
                id: accountId,
                ...fields,
                onboarding_token: providerAccount.details_submitted ? null : account.onboarding_token,
            },
            sharedContext
        )

        return await this.baseRepository_.serialize<PayoutAccountDTO>(updated)
    }

    @InjectManager()
    @EmitEvents()
    async createOnboarding(
        input: CreateOnboardingDTO,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<OnboardingDTO> {
        const payoutAccount = await this.retrievePayoutAccount(input.account_id, {
            relations: ['onboarding']
        }, sharedContext)

        const refreshUrl =
            (input.data?.refresh_url as string | undefined) ??
            `${this.options_.onboarding.refreshBaseUrl}/payout/onboarding/refresh?token=${payoutAccount.onboarding_token ?? ""}`
        const returnUrl =
            (input.data?.return_url as string | undefined) ?? this.options_.onboarding.returnUrl

        const link = await this.payoutProviderService_.createOnboarding({
            provider_id: payoutAccount.provider_id,
            context: {
                idempotency_key: input.account_id,
                ...input.context
            },
            data: {
                ...payoutAccount.data,
                ...input.data
            },
            account: this.accountRef(payoutAccount),
            refresh_url: refreshUrl,
            return_url: returnUrl,
        })

        const upsertOnboardingData = {
            ...(payoutAccount.onboarding ? { id: payoutAccount.onboarding.id } : {}),
            account: input.account_id,
            data: { ...link.data, url: link.url, kind: "onboarding", expires_at: link.expires_at ?? null },
            context: input.context as Record<string, unknown>
        }

        let onboarding: InferEntityType<typeof Onboarding>
        if (!payoutAccount.onboarding) {
            onboarding = await this.createOnboardings(
                upsertOnboardingData,
                sharedContext
            )
        } else {
            onboarding = await this.updateOnboardings(
                upsertOnboardingData,
                sharedContext
            )
        }

        return await this.baseRepository_.serialize<OnboardingDTO>(onboarding)
    }

    @InjectManager()
    async refreshLoginLink(
        accountId: string,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<OnboardingDTO | null> {
        const payoutAccount = await this.retrievePayoutAccount(accountId, {
            relations: ['onboarding']
        }, sharedContext)

        const link = await this.payoutProviderService_.createLoginLink({
            provider_id: payoutAccount.provider_id,
            account: this.accountRef(payoutAccount),
        })

        if (!link) {
            return null
        }

        const data = {
            ...(payoutAccount.onboarding?.data ?? {}),
            ...link.data,
            url: link.url,
            kind: "login",
            expires_at: link.expires_at ?? null,
        }

        const onboarding = payoutAccount.onboarding
            ? await this.updateOnboardings({ id: payoutAccount.onboarding.id, data }, sharedContext)
            : await this.createOnboardings({ account: accountId, data, context: null }, sharedContext)

        return await this.baseRepository_.serialize<OnboardingDTO>(onboarding)
    }

    @InjectManager()
    @EmitEvents()
    // @ts-ignore
    async createPayouts(
        input: CreatePayoutDTO,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutDTO> {
        const { payout, payoutAccount } = await this.createPayouts_(input, sharedContext)

        let updated: InferEntityType<typeof Payout>
        try {
            const providerResponse = await this.payoutProviderService_.createPayout({
                provider_id: payoutAccount.provider_id,
                account: this.accountRef(payoutAccount),
                amount: input.amount,
                currency_code: input.currency_code,
                context: {
                    idempotency_key: payout.id,
                    ...input.context
                },
                data: {
                    ...payoutAccount.data,
                    ...input.data
                },
                metadata: {
                    payout_id: payout.id,
                    ...(input.settlement_id ? { settlement_id: input.settlement_id } : {}),
                },
            })

            updated = await this.updatePayouts(
                {
                    id: payout.id,
                    data: providerResponse.data,
                    status: providerResponse.status,
                    provider_payout_id: providerResponse.id,
                },
                sharedContext
            )
        } catch (error) {
            await this.deletePayouts(payout.id, sharedContext).catch(() => null)
            throw error
        }

        return await this.baseRepository_.serialize<PayoutDTO>(updated)
    }

    @InjectTransactionManager()
    protected async createPayouts_(
        input: CreatePayoutDTO,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<{
        payout: InferEntityType<typeof Payout>
        payoutAccount: InferEntityType<typeof PayoutAccount>
    }> {
        const payoutAccount = await this.retrievePayoutAccount(input.account_id, {
            select: ['id', 'status', 'data', 'provider_id', 'provider_account_id']
        }, sharedContext)

        if (payoutAccount.status !== PayoutAccountStatus.ACTIVE) {
            throw new MedusaError(
                MedusaError.Types.NOT_ALLOWED,
                `Account '${input.account_id}' is not active`
            )
        }

        const payout = await super.createPayouts(
            {
                amount: Number(input.amount),
                currency_code: input.currency_code,
                account_id: payoutAccount.id,
                settlement_id: input.settlement_id ?? null,
                status: PayoutStatus.PENDING,
            },
            sharedContext
        )

        return { payout, payoutAccount }
    }

    /**
     * Writes a payout row without calling the provider; the settlement job
     * dispatches it afterwards (or never, when it is on hold).
     */
    @InjectManager()
    async createPayoutRecord(
        input: {
            account_id: string
            settlement_id?: string | null
            amount: number
            currency_code: string
            status: PayoutStatus
            status_reason?: string | null
        },
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutDTO> {
        const payout = await super.createPayouts(
            {
                account_id: input.account_id,
                settlement_id: input.settlement_id ?? null,
                amount: input.amount,
                currency_code: input.currency_code,
                status: input.status,
                status_reason: input.status_reason ?? null,
            },
            sharedContext
        )
        return await this.baseRepository_.serialize<PayoutDTO>(payout)
    }

    /**
     * Sends a pending or retriable payout row to its provider. Unlike
     * `createPayouts`, a provider error is recorded on the row instead of
     * removing it, so the settlement job can retry it from the backlog.
     */
    @InjectManager()
    @EmitEvents()
    async dispatchPayout(
        payoutId: string,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutDTO> {
        const payout = await this.retrievePayout(payoutId, { relations: ["account"] }, sharedContext)
        const account = payout.account

        if (![PayoutStatus.PENDING, PayoutStatus.FAILED, PayoutStatus.ON_HOLD].includes(payout.status)) {
            return await this.baseRepository_.serialize<PayoutDTO>(payout)
        }

        let updated: InferEntityType<typeof Payout>
        try {
            const response = await this.payoutProviderService_.createPayout({
                provider_id: account.provider_id,
                account: this.accountRef(account),
                amount: payout.amount,
                currency_code: payout.currency_code,
                context: { idempotency_key: payout.id },
                metadata: {
                    payout_id: payout.id,
                    ...(payout.settlement_id ? { settlement_id: payout.settlement_id } : {}),
                },
            })

            updated = await this.updatePayouts(
                {
                    id: payout.id,
                    status: response.status,
                    provider_payout_id: response.id,
                    status_reason: null,
                    data: response.data,
                },
                sharedContext
            )
        } catch (error) {
            updated = await this.updatePayouts(
                {
                    id: payout.id,
                    status: PayoutStatus.FAILED,
                    status_reason: errorReason(error),
                },
                sharedContext
            )
        }

        await this.syncSettlementStatus(payout.id, sharedContext)

        return await this.baseRepository_.serialize<PayoutDTO>(updated)
    }

    /**
     * A settlement follows its payout: paid out once the payout is paid,
     * failed while the payout is failed or on hold, open otherwise.
     */
    @InjectManager()
    async syncSettlementStatus(
        payoutId: string,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<void> {
        const payout = await this.retrievePayout(payoutId, {}, sharedContext)
        if (!payout.settlement_id) {
            return
        }
        const status =
            payout.status === PayoutStatus.PAID
                ? SettlementStatus.PAID_OUT
                : payout.status === PayoutStatus.FAILED || payout.status === PayoutStatus.ON_HOLD
                  ? SettlementStatus.FAILED
                  : SettlementStatus.OPEN
        await this.updateSettlements({ id: payout.settlement_id, status }, sharedContext)
    }

    @InjectManager()
    @EmitEvents()
    async dispatchTransfer(
        transferId: string,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<TransferDTO> {
        const transfer = await this.retrieveTransfer(transferId, { relations: ["account"] }, sharedContext)

        if (transfer.status !== TransferStatus.PENDING) {
            return await this.baseRepository_.serialize<TransferDTO>(transfer)
        }

        const account = transfer.account
        const metadata: Record<string, string> = {
            transfer_id: transfer.id,
            ...(transfer.order_id ? { order_id: transfer.order_id } : {}),
            ...(transfer.refund_id ? { refund_id: transfer.refund_id } : {}),
            ...(transfer.adjustment_id ? { adjustment_id: transfer.adjustment_id } : {}),
        }

        let updated: InferEntityType<typeof Transfer>
        try {
            let response
            switch (transfer.type) {
                case TransferType.REFUND_REVERSAL: {
                    const original = await this.retrieveTransfer(
                        transfer.reverses_transfer_id as string,
                        {},
                        sharedContext
                    )
                    response = await this.payoutProviderService_.reverseTransfer({
                        provider_id: transfer.provider_id,
                        transfer: {
                            id: original.provider_transfer_id as string,
                            data: (original.data ?? {}) as Record<string, unknown>,
                        },
                        amount: transfer.amount,
                        currency_code: transfer.currency_code,
                        metadata,
                        context: { idempotency_key: transfer.id },
                    })
                    break
                }
                case TransferType.ADJUSTMENT_DEBIT:
                    response = await this.payoutProviderService_.createAccountDebit({
                        provider_id: transfer.provider_id,
                        account: this.accountRef(account),
                        amount: transfer.amount,
                        currency_code: transfer.currency_code,
                        metadata,
                        context: { idempotency_key: transfer.id },
                    })
                    break
                default: {
                    const source = (transfer.data?.source_payment ?? null) as
                        | { id: string; provider_id: string; data: Record<string, unknown> }
                        | null
                    response = await this.payoutProviderService_.createTransfer({
                        provider_id: transfer.provider_id,
                        account: this.accountRef(account),
                        amount: transfer.amount,
                        currency_code: transfer.currency_code,
                        source_payment: source,
                        transfer_group: (transfer.data?.transfer_group as string | undefined) ?? null,
                        metadata,
                        context: { idempotency_key: transfer.id },
                    })
                }
            }

            updated = await this.updateTransfers(
                {
                    id: transfer.id,
                    status: response.status,
                    provider_transfer_id: response.id,
                    status_reason: null,
                    data: { ...(transfer.data ?? {}), provider: response.data },
                },
                sharedContext
            )
        } catch (error) {
            const final = (error as { final?: boolean })?.final === true
            updated = await this.updateTransfers(
                {
                    id: transfer.id,
                    status: final ? TransferStatus.ABORTED : TransferStatus.FAILED,
                    status_reason: errorReason(error),
                },
                sharedContext
            )
        }

        return await this.baseRepository_.serialize<TransferDTO>(updated)
    }

    @InjectManager()
    async getCheckpoint(
        key: string,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<string | null> {
        const [row] = await this.listPayoutCheckpoints({ key }, {}, sharedContext)
        return row?.value ?? null
    }

    @InjectManager()
    async setCheckpoint(
        key: string,
        value: string | null,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<void> {
        const [row] = await this.listPayoutCheckpoints({ key }, {}, sharedContext)
        if (row) {
            await this.updatePayoutCheckpoints({ id: row.id, value }, sharedContext)
        } else {
            await this.createPayoutCheckpoints({ key, value }, sharedContext)
        }
    }

    @InjectManager()
    async startJobRun(
        input: CreatePayoutJobRunDTO,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutJobRunDTO> {
        const run = await this.createPayoutJobRuns(
            {
                job: input.job,
                trigger: input.trigger,
                status: PayoutJobRunStatus.RUNNING,
                started_at: new Date(),
            },
            sharedContext
        )
        return await this.baseRepository_.serialize<PayoutJobRunDTO>(run)
    }

    @InjectManager()
    async finishJobRun(
        runId: string,
        result: { stats?: Record<string, unknown>; error?: string },
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutJobRunDTO> {
        const run = await this.updatePayoutJobRuns(
            {
                id: runId,
                status: result.error ? PayoutJobRunStatus.FAILED : PayoutJobRunStatus.SUCCEEDED,
                finished_at: new Date(),
                stats: result.stats ?? null,
                error: result.error ? result.error.slice(0, REASON_MAX_LENGTH) : null,
            },
            sharedContext
        )
        return await this.baseRepository_.serialize<PayoutJobRunDTO>(run)
    }

    async getWebhookActionAndData(
        input: PayoutWebhookActionInput & { provider_id?: string }
    ): Promise<PayoutWebhookResult> {
        const providerId = input.provider_id ?? this.getDefaultProviderId()
        return await this.payoutProviderService_.getWebhookActionAndData({
            provider_id: providerId,
            data: input.data,
            rawData: input.rawData,
            headers: input.headers,
        })
    }
}
