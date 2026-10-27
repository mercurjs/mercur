import {
    EmitEvents,
    InjectManager,
    MedusaContext,
    MedusaService,
} from "@medusajs/framework/utils"
import {
    AccountOutput,
    CreatePayoutAccountDTO,
    CreateOnboardingDTO,
    ListAccountsInput,
    ListAccountsOutput,
    OnboardingDTO,
    PayoutAccountDTO,
    PayoutDTO,
    PayoutModuleOptions,
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
import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import { deriveAccountStatus, deriveKycStatus } from "../utils/kyc"

type InjectedDependencies = {
    payoutProviderService: PayoutProviderService
    baseRepository: DAL.RepositoryService
}

const REASON_MAX_LENGTH = 1024

const DISPATCHABLE = [PayoutStatus.PENDING, PayoutStatus.FAILED]

const errorReason = (error: unknown): string => {
    const message = error instanceof Error ? error.message : String(error)
    return message.slice(0, REASON_MAX_LENGTH)
}

// A provider caches an idempotency key with the request that first used it,
// so a retry after a refused attempt needs a fresh key.
const idempotencyKey = (id: string, attempt: number) =>
    attempt === 1 ? id : `${id}:${attempt}`

export default class PayoutModuleService extends MedusaService({
    Onboarding,
    Payout,
    PayoutAccount,
    PayoutReversal,
}) {
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

    protected accountRef(account: { external_id?: string | null; data?: Record<string, unknown> | null }) {
        return {
            id: account.external_id ?? ((account.data?.id as string | undefined) ?? ""),
            data: (account.data ?? {}) as Record<string, unknown>,
        }
    }

    protected accountFieldsFromProvider(account: AccountOutput) {
        return {
            external_id: account.id,
            status: deriveAccountStatus(account),
            kyc_status: deriveKycStatus(account.requirements, account.disabled_reason),
            payouts_enabled: account.payouts_enabled,
            charges_enabled: account.charges_enabled,
            details_submitted: account.details_submitted,
            disabled_reason: account.disabled_reason,
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
        let payoutAccount: InferEntityType<typeof PayoutAccount> | null = null
        let providerAccount: AccountOutput | null = null

        try {
            payoutAccount = await this.createPayoutAccounts(
                {
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
            account: this.accountRef(account),
        })

        const updated = await this.updatePayoutAccounts(
            {
                id: accountId,
                ...this.accountFieldsFromProvider(providerAccount),
                onboarding_token: providerAccount.details_submitted ? null : account.onboarding_token,
            },
            sharedContext
        )

        return await this.baseRepository_.serialize<PayoutAccountDTO>(updated)
    }

    async listProviderAccounts(input: ListAccountsInput): Promise<ListAccountsOutput | null> {
        return await this.payoutProviderService_.listAccounts(input)
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

        const onboarding = payoutAccount.onboarding
            ? await this.updateOnboardings(upsertOnboardingData, sharedContext)
            : await this.createOnboardings(upsertOnboardingData, sharedContext)

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

    /**
     * Sends a pending or failed payout to the provider. A provider error is
     * recorded on the row instead of throwing, so the payout can be retried.
     */
    @InjectManager()
    @EmitEvents()
    async dispatchPayout(
        payoutId: string,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutDTO> {
        const payout = await this.retrievePayout(payoutId, { relations: ["account"] }, sharedContext)

        if (!DISPATCHABLE.includes(payout.status)) {
            return await this.baseRepository_.serialize<PayoutDTO>(payout)
        }

        const attempt = Number(payout.data?.attempts ?? 0) + 1
        await this.updatePayouts({ id: payout.id, data: { ...(payout.data ?? {}), attempts: attempt } }, sharedContext)

        const source = (payout.data?.source_payment ?? null) as
            | { id: string; data: Record<string, unknown> }
            | null

        let updated: InferEntityType<typeof Payout>
        try {
            const response = await this.payoutProviderService_.createPayout({
                account: this.accountRef(payout.account),
                amount: payout.amount,
                currency_code: payout.currency_code,
                source_payment: source,
                group: payout.order_id,
                metadata: {
                    payout_id: payout.id,
                    ...(payout.order_id ? { order_id: payout.order_id } : {}),
                },
                context: { idempotency_key: idempotencyKey(payout.id, attempt) },
            })

            updated = await this.updatePayouts(
                {
                    id: payout.id,
                    status: response.status,
                    status_reason: null,
                    data: { ...(payout.data ?? {}), attempts: attempt, provider: { ...response.data, id: response.id } },
                },
                sharedContext
            )
        } catch (error) {
            const final = (error as { final?: boolean })?.final === true
            updated = await this.updatePayouts(
                {
                    id: payout.id,
                    status: final ? PayoutStatus.ABORTED : PayoutStatus.FAILED,
                    status_reason: errorReason(error),
                },
                sharedContext
            )
        }

        return await this.baseRepository_.serialize<PayoutDTO>(updated)
    }

    @InjectManager()
    @EmitEvents()
    async dispatchPayoutReversal(
        reversalId: string,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutReversalDTO> {
        const reversal = await this.retrievePayoutReversal(reversalId, { relations: ["payout"] }, sharedContext)

        if (!DISPATCHABLE.includes(reversal.status)) {
            return await this.baseRepository_.serialize<PayoutReversalDTO>(reversal)
        }

        const payout = reversal.payout
        const attempt = Number(reversal.data?.attempts ?? 0) + 1
        await this.updatePayoutReversals(
            { id: reversal.id, data: { ...(reversal.data ?? {}), attempts: attempt } },
            sharedContext
        )

        let updated: InferEntityType<typeof PayoutReversal>
        try {
            const provider = (payout.data?.provider ?? {}) as Record<string, unknown>
            const response = await this.payoutProviderService_.reversePayout({
                payout: { id: provider.id as string, data: provider },
                amount: reversal.amount,
                currency_code: payout.currency_code,
                metadata: {
                    payout_id: payout.id,
                    payout_reversal_id: reversal.id,
                    ...(reversal.refund_id ? { refund_id: reversal.refund_id } : {}),
                },
                context: { idempotency_key: idempotencyKey(reversal.id, attempt) },
            })

            updated = await this.updatePayoutReversals(
                {
                    id: reversal.id,
                    status: response.status,
                    status_reason: null,
                    data: { ...(reversal.data ?? {}), attempts: attempt, provider: { ...response.data, id: response.id } },
                },
                sharedContext
            )
        } catch (error) {
            const final = (error as { final?: boolean })?.final === true
            updated = await this.updatePayoutReversals(
                {
                    id: reversal.id,
                    status: final ? PayoutStatus.ABORTED : PayoutStatus.FAILED,
                    status_reason: errorReason(error),
                },
                sharedContext
            )
        }

        return await this.baseRepository_.serialize<PayoutReversalDTO>(updated)
    }

    async getWebhookActionAndData(input: PayoutWebhookActionInput): Promise<PayoutWebhookResult> {
        return await this.payoutProviderService_.getWebhookActionAndData(input)
    }
}
