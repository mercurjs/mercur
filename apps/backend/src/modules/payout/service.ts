import { EntityManager } from '@mikro-orm/knex'

import { Context } from '@medusajs/framework/types'
import {
  InjectTransactionManager,
  MedusaContext,
  MedusaService
} from '@medusajs/framework/utils'

import { Onboarding, PayoutAccount, Transfer } from './models'
import {
  CreateOnboardingDTO,
  CreatePayoutAccountDTO,
  IPayoutProvider,
  PayoutWebhookActionPayload
} from './types'

type InjectedDependencies = {
  payoutProvider: IPayoutProvider
}

class PayoutModuleService extends MedusaService({
  Transfer,
  PayoutAccount,
  Onboarding
}) {
  protected provider_: IPayoutProvider

  constructor({ payoutProvider }: InjectedDependencies) {
    super(...arguments)
    this.provider_ = payoutProvider
  }

  @InjectTransactionManager()
  // @ts-expect-error: createPaymentProfiles method already exists
  async createPayoutAccounts(
    { context }: CreatePayoutAccountDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const result = await super.createPayoutAccounts({ context }, sharedContext)

    const { data, id: referenceId } = await this.provider_.createPayoutAccount({
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
  }

  @InjectTransactionManager()
  // @ts-expect-error: createOnboardings method already exists
  async createOnboardings(
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

  async getWebhookActionAndData(input: PayoutWebhookActionPayload) {
    return this.provider_.getWebhookActionAndData(input)
  }
}

export default PayoutModuleService
