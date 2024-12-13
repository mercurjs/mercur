import { model } from '@medusajs/framework/utils'

import { Seller } from './seller'

export const Onboarding = model.define('onboarding', {
  id: model.id({ prefix: 'onb' }).primaryKey(),
  is_payout_account_setup_completed: model.boolean().default(false),
  seller: model.belongsTo(() => Seller, { mappedBy: 'onboarding' })
})
