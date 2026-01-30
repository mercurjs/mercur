import { model } from "@medusajs/framework/utils";

import { PayoutAccount } from "./payout-account";

export const PayoutBalance = model
  .define("payout_balance", {
    id: model.id({ prefix: "pbal" }).primaryKey(),
    currency_code: model.text(),
    /**
     * PayoutBalance.totals JSON structure:
     * {
     *   balance: BigNumberValue,              // Current available balance (display)
     *   raw_balance: BigNumberRawValue,       // Raw balance for precise calculations
     * }
     *
     * Example:
     * {
     *   balance: 15000,                        // $150.00 (in cents)
     *   raw_balance: { value: "15000", precision: 20 }
     * }
     */
    totals: model.json(),
    account: model.belongsTo(() => PayoutAccount, {
      mappedBy: "balances",
    }),
  })
  .indexes([
    {
      name: "IDX_payout_balance_account_currency",
      on: ["account_id", "currency_code"],
      unique: true,
    },
  ]);
