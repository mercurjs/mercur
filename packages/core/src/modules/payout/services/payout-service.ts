import {
    BigNumber,
    createRawPropertiesFromBigNumber,
    EmitEvents,
    InjectManager,
    InjectTransactionManager,
    MathBN,
    MedusaContext,
    MedusaService,
    promiseAll,
} from "@medusajs/framework/utils"
import {
    CreatePayoutAccountDTO,
    CreatePayoutAccountResponse,
    CreatePayoutDTO,
    CreatePayoutReversalDTO,
    CreateOnboardingDTO,
    CreatePayoutTransactionDTO,
    OnboardingDTO,
    PayoutAccountDTO,
    PayoutDTO,
    PayoutReversalDTO,
    PayoutTransactionDTO,
    PayoutWebhookActionInput,
    PayoutWebhookResult,
    PayoutBalanceDTO,
    PayoutBalanceTotals,
} from "@mercurjs/types"
import PayoutProviderService from "./provider-service"
import { Onboarding, Payout, PayoutAccount, PayoutBalance, PayoutReversal, PayoutTransaction } from "../models"
import { BigNumberInput, Context, DAL, InferEntityType } from "@medusajs/framework/types"
import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import { IsolationLevel } from "@medusajs/framework/mikro-orm/core"
import { calculatePayoutTransactions } from "../utils/calculate-payout-transactions"

type InjectedDependencies = {
    payoutProviderService: PayoutProviderService
    baseRepository: DAL.RepositoryService
}

export default class PayoutService extends MedusaService({
    Onboarding,
    Payout,
    PayoutAccount,
    PayoutBalance,
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

    @InjectTransactionManager()
    private async addPayoutTransactions_(
        account_id: string,
        transactions: Omit<CreatePayoutTransactionDTO, 'account_id'>[],
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutTransactionDTO[]> {
        return await this.baseRepository_.transaction<EntityManager>(
            async (transactionManager) => {
                // Group transactions by currency_code
                const groupedByCurrency = transactions.reduce((acc, txn) => {
                    if (!acc[txn.currency_code]) {
                        acc[txn.currency_code] = []
                    }
                    acc[txn.currency_code].push(txn)
                    return acc
                }, {} as Record<string, Omit<CreatePayoutTransactionDTO, 'account_id'>[]>)

                // Update balances for each currency
                await promiseAll(
                    Object.entries(groupedByCurrency).map(async ([currency_code, currencyTransactions]) => {
                        const [existingBalance] = await this.listPayoutBalances(
                            { account_id, currency_code },
                            { take: 1 },
                            { transactionManager }
                        )

                        const newTotals = calculatePayoutTransactions({
                            currentBalance: existingBalance as unknown as PayoutBalanceDTO,
                            transactions: currencyTransactions
                        })

                        if (!existingBalance) {
                            await this.createPayoutBalances(
                                { account_id, currency_code, totals: newTotals },
                                { transactionManager }
                            )
                        } else {
                            await this.updatePayoutBalances(
                                { id: existingBalance.id, totals: newTotals },
                                { transactionManager }
                            )
                        }
                    })
                )

                const createdTransactions = await this.createPayoutTransactions(
                    transactions.map((txn) => ({
                        ...txn,
                        account_id,
                    })),
                    { transactionManager }
                )

                return await this.baseRepository_.serialize<PayoutTransactionDTO[]>(createdTransactions)
            },
            {
                transaction: sharedContext?.transactionManager,
                isolationLevel: IsolationLevel.SERIALIZABLE,
            }
        )
    }

    @InjectManager()
    @EmitEvents()
    async addPayoutTransactions(
        account_id: string,
        transactions: Omit<CreatePayoutTransactionDTO, 'account_id'>[],
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<PayoutTransactionDTO[]> {
        return await this.addPayoutTransactions_(
            account_id,
            transactions,
            sharedContext
        )
    }

    @InjectTransactionManager()
    @EmitEvents()
    // @ts-ignore
    async deletePayoutTransactions(
        transactionIds: string | string[],
        @MedusaContext() sharedContext: Context<EntityManager> = {}
    ): Promise<void> {
        const ids = Array.isArray(transactionIds) ? transactionIds : [transactionIds]

        if (!ids.length) {
            return
        }

        const transactions = await super.listPayoutTransactions(
            { id: ids },
            undefined,
            sharedContext
        )

        if (!transactions.length) {
            return
        }

        await super.deletePayoutTransactions(ids, sharedContext)

        await this.updatePayoutBalanceAfterUpdate_(transactions, sharedContext)
    }

    @InjectTransactionManager()
    private async updatePayoutBalanceAfterUpdate_(
        transactions: PayoutTransactionDTO[],
        @MedusaContext() sharedContext: Context<EntityManager> = {}
    ): Promise<void> {
        // Group transactions by account_id and currency_code
        const grouped = transactions.reduce((acc, txn) => {
            const key = `${txn.account_id}-${txn.currency_code}`
            if (!acc[key]) {
                acc[key] = {
                    account_id: txn.account_id,
                    currency_code: txn.currency_code,
                    totalAmount: MathBN.convert(0)
                }
            }
            acc[key].totalAmount = MathBN.add(acc[key].totalAmount, txn.amount)
            return acc
        }, {} as Record<string, { account_id: string; currency_code: string; totalAmount: BigNumberInput }>)

        await promiseAll(
            Object.values(grouped).map(async (group) => {
                const [balance] = await this.listPayoutBalances(
                    { account_id: group.account_id, currency_code: group.currency_code },
                    { take: 1 },
                    sharedContext
                )

                if (!balance) {
                    return
                }

                const currentRawBalance = (balance.totals as unknown as PayoutBalanceTotals)?.raw_balance?.value ?? "0"

                // Subtract the deleted transaction amounts from the balance
                const newBalance = MathBN.sub(
                    MathBN.convert(currentRawBalance),
                    group.totalAmount
                )

                const totals = {
                    balance: new BigNumber(newBalance),
                }

                createRawPropertiesFromBigNumber(totals)

                await this.updatePayoutBalances(
                    { id: balance.id, totals },
                    sharedContext
                )
            })
        )
    }
}
