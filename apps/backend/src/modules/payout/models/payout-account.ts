import { model } from '@medusajs/framework/utils'

import { PayoutAccountStatus } from '../types'
import { Onboarding } from './onboarding'

export const PayoutAccount = model.define('payout_account', {
  id: model.id({ prefix: 'pacc' }).primaryKey(),
  status: model.enum(PayoutAccountStatus).default(PayoutAccountStatus.PENDING),
  reference_id: model.text().nullable(),
  data: model.json().nullable(),
  context: model.json().nullable(),
  onboarding: model.hasOne(() => Onboarding).nullable()
})
