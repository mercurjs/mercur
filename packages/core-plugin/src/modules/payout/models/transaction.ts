import { model } from '@medusajs/framework/utils'

import { PayoutAccount } from './payout-account'

export const PayoutTransaction = model.define('payout_transaction', {
  id: model.id({ prefix: 'ptxn' }).primaryKey(),
  amount: model.bigNumber(),
  currency_code: model.text(),
  reference: model.text().nullable(),
  reference_id: model.text().nullable(),
  account: model.belongsTo(() => PayoutAccount, {
    mappedBy: 'transactions'
  }),
})
  .indexes([
    {
      name: "IDX_payout_transaction_account_id",
      on: ["account_id"],
    },
    {
      name: "IDX_payout_transaction_reference",
      on: ["reference", "reference_id"],
    },
  ])
