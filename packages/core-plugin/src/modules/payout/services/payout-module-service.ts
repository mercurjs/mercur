import {
    EmitEvents,
    InjectManager,
    InjectTransactionManager,
    MedusaContext,
    MedusaError,
    MedusaService,
} from "@medusajs/framework/utils"
import {
    CreatePayoutAccountDTO,
    CreatePayoutAccountResponse,
    CreatePayoutDTO,
    CreateOnboardingDTO,
    OnboardingDTO,
    PayoutAccountDTO,
    PayoutAccountStatus,
    PayoutDTO,
    PayoutWebhookActionInput,
    PayoutWebhookResult,
    PayoutModuleOptions,
    PAYOUT_MODULE_OPTION_DEFAULTS,
} from "@mercurjs/types"
import PayoutProviderService from "./provider-service"
import { Onboarding, Payout, PayoutAccount } from "../models"
import { Context, DAL, InferEntityType, ModulesSdkTypes } from "@medusajs/framework/types"
import { EntityManager } from "@medusajs/framework/mikro-orm/knex"

type InjectedDependencies = {
    payoutProviderService: PayoutProviderService
    baseRepository: DAL.RepositoryService
}

export default class PayoutModuleService extends MedusaService({
    Onboarding,
    Payout,
    PayoutAccount,
}) {
    protected readonly payoutProviderService_: PayoutProviderService
    protected readonly baseRepository_: DAL.RepositoryService
    protected readonly options_: PayoutModuleOptions

    constructor({ payoutProviderService, baseRepository }: InjectedDependencies, options: PayoutModuleOptions) {
        // @ts-ignore
        super(...arguments)
        this.payoutProviderService_ = payoutProviderService
        this.baseRepository_ = baseRepository
        this.options_ = {
            ...PAYOUT_MODULE_OPTION_DEFAULTS,
            ...(options ?? {}),
        }
    }

    getOptions() {
        return {
            ...PAYOUT_MODULE_OPTION_DEFAULTS,
            ...(this.options_ ?? {}),
        }
    }

    @InjectManager()
    @EmitEvents()
    async createPayoutAccount(
        input: CreatePayoutAccountDTO,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutAccountDTO> {
        let payoutAccount: InferEntityType<typeof PayoutAccount> | null = null
        let providerAccount: CreatePayoutAccountResponse | null = null

        try {
            payoutAccount = await this.createPayoutAccounts(
                { data: input.data, context: input.context as Record<string, unknown> },
                sharedContext
            )

            providerAccount = await this.payoutProviderService_.createPayoutAccount({
                context: {
                    idempotency_key: payoutAccount.id,
                    ...input.context
                },
                data: input.data
            })

            payoutAccount = await this.updatePayoutAccounts(
                {
                    id: payoutAccount.id,
                    data: providerAccount.data,
                    status: providerAccount.status
                },
                sharedContext
            )
        } catch (error) {
            if (payoutAccount?.id) {
                await this.deletePayoutAccounts(payoutAccount.id, sharedContext)
            }
            throw error
        }

        return await this.baseRepository_.serialize<PayoutAccountDTO>(payoutAccount)
    }

    @InjectTransactionManager()
    @EmitEvents()
    async createOnboarding(
        input: CreateOnboardingDTO,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<OnboardingDTO> {
        const payoutAccount = await this.retrievePayoutAccount(input.account_id, {
            select: ['data'],
            relations: ['onboarding']
        }, sharedContext)

        const providerData = await this.payoutProviderService_.createOnboarding(
            {
                context: {
                    idempotency_key: input.account_id,
                    ...input.context
                },
                data: {
                    ...payoutAccount.data,
                    ...input.data
                }
            }
        )

        const upsertOnboardingData = {
            ...(payoutAccount.onboarding ? { id: payoutAccount.onboarding.id } : {}),
            payout_account_id: input.account_id,
            data: providerData.data,
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

    @InjectTransactionManager()
    @EmitEvents()
    // @ts-ignore
    async createPayouts(
        input: CreatePayoutDTO,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutDTO> {
        const payoutAccount = await this.retrievePayoutAccount(input.account_id, {
            select: ['id', 'status', 'data']
        }, sharedContext)

        if (payoutAccount.status !== PayoutAccountStatus.ACTIVE) {
            throw new MedusaError(
                MedusaError.Types.NOT_ALLOWED,
                `Account '${input.account_id}' is not active`
            )
        }

        const providerResponse = await this.payoutProviderService_.createPayout({
            account_id: input.account_id,
            amount: input.amount,
            currency_code: input.currency_code,
            context: input.context,
            data: {
                ...payoutAccount.data,
                ...input.data
            }
        })

        const payout = await super.createPayouts(
            {
                amount: input.amount,
                currency_code: input.currency_code,
                account_id: payoutAccount.id,
                data: providerResponse.data,
                status: providerResponse.status,
            },
            sharedContext
        )

        return await this.baseRepository_.serialize<PayoutDTO>(payout)
    }

    async getWebhookActionAndData(
        input: PayoutWebhookActionInput
    ): Promise<PayoutWebhookResult> {
        return await this.payoutProviderService_.getWebhookActionAndData(input)
    }
}
