import { EntityManager } from '@mikro-orm/knex'

import { Context } from '@medusajs/framework/types'
import {
  InjectTransactionManager,
  MedusaContext,
  MedusaService
} from '@medusajs/framework/utils'

import { PayoutAccount, Transfer } from './models'
import { CreatePayoutAccountDTO, IPayoutProvider } from './types'

type InjectedDependencies = {
  payoutProvider: IPayoutProvider
}

class PayoutModuleService extends MedusaService({
  Transfer,
  PayoutAccount
}) {
  protected provider_: IPayoutProvider

  constructor({ payoutProvider }: InjectedDependencies) {
    super(...arguments)
    this.provider_ = payoutProvider
  }

  @InjectTransactionManager()
  // @ts-expect-error: createTransfers method already exists
  async createTransfers() {}

  @InjectTransactionManager()
  // @ts-expect-error: createPaymentProfiles method already exists
  async createPayoutAccounts(
    { context }: CreatePayoutAccountDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const result = await super.createPayoutAccounts({}, sharedContext)

    const { data, id: referenceId } = await this.provider_.createPayoutAccount({
      context
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

  // todo: delete payment accounts
}

export default PayoutModuleService
