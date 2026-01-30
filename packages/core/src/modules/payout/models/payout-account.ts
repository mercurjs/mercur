import { model } from "@medusajs/framework/utils";

import { PayoutAccountStatus } from "@mercurjs/types";
import { Onboarding } from "./onboarding";
import { Payout } from "./payout";
import { PayoutTransaction } from "./transaction";
import { PayoutBalance } from "./balance";

export const PayoutAccount = model.define("payout_account", {
  id: model.id({ prefix: "pacc" }).primaryKey(),
  status: model.enum(PayoutAccountStatus).default(PayoutAccountStatus.PENDING),
  data: model.json(),
  context: model.json().nullable(),
  onboarding: model.hasOne(() => Onboarding, {
    mappedBy: 'account'
  }).nullable(),
  payouts: model.hasMany(() => Payout, {
    mappedBy: 'account'
  }),
  transactions: model.hasMany(() => PayoutTransaction, {
    mappedBy: 'account'
  }),
  balances: model.hasMany(() => PayoutBalance, {
    mappedBy: 'account'
  }),
});
