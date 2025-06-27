import { model } from '@medusajs/framework/utils'

import { PayoutAccount } from './payout-account'

export const Onboarding = model.define('onboarding', {
  id: model.id({ prefix: 'onb' }).primaryKey(),
  data: model.json().nullable(),
  context: model.json().nullable(),
  payout_account: model.belongsTo(() => PayoutAccount, {
    mappedBy: 'onboarding'
  })
})
