import { EntityManager } from '@mikro-orm/knex'

import { Context } from '@medusajs/framework/types'
import {
  InjectTransactionManager,
  MedusaContext,
  MedusaService
} from '@medusajs/framework/utils'

import { PaymentAccount, Transfer } from './models'
import { CreatePaymentAccountDTO, IPayoutsProvider } from './types'

type InjectedDependencies = {
  payoutsProvider: IPayoutsProvider
}

class PayoutsModuleService extends MedusaService({
  Transfer,
  PaymentAccount
}) {
  protected provider_: IPayoutsProvider

  constructor({ payoutsProvider }: InjectedDependencies) {
    super(...arguments)
    this.provider_ = payoutsProvider
  }

  @InjectTransactionManager()
  // @ts-expect-error: createPaymentProfiles method already exists
  async createPaymentAccounts(
    { context }: CreatePaymentAccountDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const result = await super.createPaymentAccounts({}, sharedContext)

    const { data, id: referenceId } = await this.provider_.createPaymentAccount(
      { context }
    )

    await this.updatePaymentAccounts(
      {
        id: result.id,
        data,
        reference_id: referenceId
      },
      sharedContext
    )

    const updated = await this.retrievePaymentAccount(
      result.id,
      undefined,
      sharedContext
    )

    return updated
  }

  // todo: delete payment accounts
}

export default PayoutsModuleService
