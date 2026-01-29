import {
    EmitEvents,
    InjectManager,
    MedusaContext,
    MedusaError,
    MedusaService,
} from "@medusajs/framework/utils"
import {
    CreatePayoutAccountDTO,
    CreatePayoutAccountResponse,
    InitializeOnboardingDTO,
    InitializeOnboardingResponse,
    OnboardingDTO,
    PayoutAccountDTO,
    PayoutDTO,
    PayoutReversalDTO,
    PayoutWebhookResult,
} from "@mercurjs/types"
import PayoutProviderService from "./provider-service"
import { Onboarding, Payout, PayoutAccount, PayoutReversal } from "../models"
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
                    data: {
                        ...input.data,
                        ...providerAccount.data
                    },
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
    async initializeOnboarding(
        accountId: string,
        input: InitializeOnboardingDTO,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<OnboardingDTO> {

        const [existingOnboarding] = await this.listOnboardings({
            account_id: accountId
        })
        const payoutAccount = await this.retrievePayoutAccount(accountId, {
            select: ['data']
        }, sharedContext)

        const providerData = await this.payoutProviderService_.initializeOnboarding(
            {
                context: {
                    idempotency_key: accountId,
                    ...input.context
                },
                data: {
                    ...payoutAccount.data,
                    ...input.data
                }
            }
        )

        const upsertOnboardingData = {
            ...(existingOnboarding ? { id: existingOnboarding.id } : {}),
            payout_account_id: accountId,
            data: {
                ...input.data,
                ...providerData.data,
            },
            context: input.context as Record<string, unknown>
        }

        let onboarding: InferEntityType<typeof Onboarding>
        if (!existingOnboarding) {
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
        const { amount, currency_code, account_id, transaction_id, source_transaction } = input

        const payoutAccount = await this.retrievePayoutAccount(
            account_id,
            undefined,
            sharedContext
        )

        if (!payoutAccount.reference_id) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `Payout account ${account_id} has no reference ID`
            )
        }

        let providerData: Record<string, unknown>

        try {
            const response = await this.payoutProviderService_.createPayout({
                account_reference_id: payoutAccount.reference_id,
                amount,
                currency: currency_code,
                transaction_id,
                source_transaction,
            })
            providerData = response.data
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Error creating payout for transaction ${transaction_id}: ${error.message}`
            )
        }

        const payout = await this.createPayouts(
            {
                data: providerData,
                amount,
                currency_code,
                transaction_id,
                payout_account: payoutAccount.id,
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
        const payout = await this.retrievePayout(input., undefined, sharedContext)

        if (!payout?.data?.id) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Payout ${input.payout_id} not found or has no provider data`
            )
        }

        const transferId = payout.data.id as string
        let reversalData: Record<string, unknown>

        try {
            const response = await this.payoutProviderService_.reversePayout({
                transfer_id: transferId,
                amount: input.amount,
                currency: input.currency_code,
            })
            reversalData = response.data
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Error reversing payout ${input.payout_id}: ${error.message}`
            )
        }

        const payoutReversal = await this.createPayoutReversals(
            {
                data: reversalData,
                amount: input.amount,
                currency_code: input.currency_code,
                payout: payout.id,
            },
            sharedContext
        )

        return await this.baseRepository_.serialize<PayoutReversalDTO>(payoutReversal)
    }

    @InjectManager()
    async getWebhookActionAndData(
        payload: PayoutWebhookActionPayload
    ): Promise<PayoutWebhookResult> {
        return await this.payoutProviderService_.getWebhookActionAndData(payload)
    }
}
