import { model } from "@medusajs/framework/utils";

import { PayoutAccountStatus } from "@mercurjs/framework";
import { Onboarding } from "./onboarding";
import { Payout } from "./payout";
import { PaymentProvider } from "../../../api/vendor/payout-account/types";

export const PayoutAccount = model.define("payout_account", {
  id: model.id({ prefix: "pacc" }).primaryKey(),
  status: model.enum(PayoutAccountStatus).default(PayoutAccountStatus.PENDING),
  reference_id: model.text(),
  payment_provider_id: model.enum(PaymentProvider),
  data: model.json(),
  context: model.json().nullable(),
  onboarding: model.hasOne(() => Onboarding).nullable(),
  payouts: model.hasMany(() => Payout),
});
