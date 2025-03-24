import { EntityManager } from '@mikro-orm/knex'

import { Context } from '@medusajs/framework/types'
import {
  InjectTransactionManager,
  MedusaContext,
  MedusaService
} from '@medusajs/framework/utils'

import { Onboarding, Payout, PayoutAccount } from './models'
import {
  CreateOnboardingDTO,
  CreatePayoutAccountDTO,
  CreatePayoutDTO,
  IPayoutProvider,
  PayoutWebhookActionPayload
} from './types'

type InjectedDependencies = {
  payoutProvider: IPayoutProvider
}

class PayoutModuleService extends MedusaService({
  Payout,
  PayoutAccount,
  Onboarding
}) {
  protected provider_: IPayoutProvider

  constructor({ payoutProvider }: InjectedDependencies) {
    super(...arguments)
    this.provider_ = payoutProvider
  }

  @InjectTransactionManager()
  async createPayoutAccount(
    { context }: CreatePayoutAccountDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const result = await this.createPayoutAccounts(
      { context, reference_id: 'placeholder', data: {} },
      sharedContext
    )

    try {
      const { data, id: referenceId } =
        await this.provider_.createPayoutAccount({
          context,
          account_id: result.id
        })

      await this.updatePayoutAccounts(
        {
          id: result.id,
          data,
          reference_id: referenceId
        },
        sharedContext
      )

      const updated = await this.retrievePayoutAccount(
        result.id,
        undefined,
        sharedContext
      )
      return updated
    } catch (error) {
      await this.deletePayoutAccounts(result.id, sharedContext)
      throw error
    }
  }

  @InjectTransactionManager()
  async initializeOnboarding(
    { context, payout_account_id }: CreateOnboardingDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const [existingOnboarding] = await this.listOnboardings({
      payout_account_id
    })
    const account = await this.retrievePayoutAccount(payout_account_id)

    const { data: providerData } = await this.provider_.initializeOnboarding(
      account.reference_id!,
      context
    )

    let onboarding = existingOnboarding
    if (!existingOnboarding) {
      onboarding = await super.createOnboardings(
        {
          payout_account_id
        },
        sharedContext
      )
    }

    await this.updateOnboardings(
      {
        id: onboarding.id,
        data: providerData,
        context
      },
      sharedContext
    )

    return await this.retrieveOnboarding(
      onboarding.id,
      undefined,
      sharedContext
    )
  }

  @InjectTransactionManager()
  async createPayout(
    input: CreatePayoutDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const { amount, currency_code, account_id, transaction_id } = input

    const payoutAccount = await this.retrievePayoutAccount(account_id)

    const { data } = await this.provider_.createPayout({
      account_reference_id: payoutAccount.reference_id,
      amount,
      currency: currency_code,
      transaction_id
    })

    // @ts-expect-error BigNumber incompatible interface
    const payout = await this.createPayouts(
      {
        data,
        amount,
        currency_code,
        payout_account: payoutAccount.id
      },
      sharedContext
    )

    return payout
  }

  async getWebhookActionAndData(input: PayoutWebhookActionPayload) {
    return await this.provider_.getWebhookActionAndData(input)
  }
}

export default PayoutModuleService
