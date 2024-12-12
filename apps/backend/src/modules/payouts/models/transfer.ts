import { model } from '@medusajs/framework/utils'

import { TransferStatus } from '../types'

export const Transfer = model.define('transfer', {
  id: model.id({ prefix: 'trf' }).primaryKey(),
  status: model.enum(TransferStatus),
  currency_code: model.text(),
  amount: model.bigNumber(),
  data: model.json()
})
