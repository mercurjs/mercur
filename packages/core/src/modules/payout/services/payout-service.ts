import {
    EmitEvents,
    InjectManager,
    MedusaContext,
    MedusaService,
} from "@medusajs/framework/utils"
import {
    CreatePayoutAccountDTO,
    CreatePayoutAccountResponse,
    CreatePayoutDTO,
    CreatePayoutReversalDTO,
    CreateOnboardingDTO,
    OnboardingDTO,
    PayoutAccountDTO,
    PayoutDTO,
    PayoutReversalDTO,
    PayoutWebhookActionInput,
    PayoutWebhookResult,
} from "@mercurjs/types"
import PayoutProviderService from "./provider-service"
import { Onboarding, Payout, PayoutAccount, PayoutReversal, PayoutTransaction } from "../models"
import { Context, DAL, InferEntityType } from "@medusajs/framework/types"
import { EntityManager } from "@medusajs/framework/mikro-orm/core"

type InjectedDependencies = {
    payoutProviderService: PayoutProviderService
    baseRepository: DAL.RepositoryService
}

export default class PayoutService extends MedusaService({
    Onboarding,
    Payout,
    PayoutAccount,
    PayoutReversal,
    PayoutTransaction,
}) {
    protected readonly payoutProviderService_: PayoutProviderService
    protected readonly baseRepository_: DAL.RepositoryService

    constructor({ payoutProviderService, baseRepository }: InjectedDependencies) {
        super(...arguments)
        this.payoutProviderService_ = payoutProviderService
        this.baseRepository_ = baseRepository
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

    @InjectManager()
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

    @InjectManager()
    @EmitEvents()
    async createPayout(
        input: CreatePayoutDTO,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutDTO> {
        const payoutAccount = await this.retrievePayoutAccount(input.account_id, {
            select: ['id', 'data']
        }, sharedContext)

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

        const payout = await this.createPayouts(
            {
                amount: input.amount,
                currency_code: input.currency_code,
                account: payoutAccount.id,
                data: providerResponse.data,
                status: providerResponse.status,
            },
            sharedContext
        )

        return await this.baseRepository_.serialize<PayoutDTO>(payout)
    }

    @InjectManager()
    @EmitEvents()
    async createPayoutReversal(
        input: CreatePayoutReversalDTO,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutReversalDTO> {
        const payoutAccount = await this.retrievePayoutAccount(input.account_id, {
            select: ['id', 'data']
        }, sharedContext)

        const providerResponse = await this.payoutProviderService_.createReversal({
            account_id: input.account_id,
            amount: input.amount,
            currency_code: input.currency_code,
            context: input.context,
            data: {
                ...payoutAccount.data,
                ...input.data
            }
        })

        const payoutReversal = await this.createPayoutReversals(
            {
                amount: input.amount,
                currency_code: input.currency_code,
                data: providerResponse.data,
            },
            sharedContext
        )

        return await this.baseRepository_.serialize<PayoutReversalDTO>(payoutReversal)
    }

    async getWebhookActionAndData(
        input: PayoutWebhookActionInput
    ): Promise<PayoutWebhookResult> {
        return await this.payoutProviderService_.getWebhookActionAndData(input)
    }
}
