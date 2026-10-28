import { model } from "@medusajs/framework/utils";

import { PayoutAccountStatus, PayoutKycStatus } from "@mercurjs/types";
import { Onboarding } from "./onboarding";
import { Payout } from "./payout";

export const PayoutAccount = model
  .define("payout_account", {
    id: model.id({ prefix: "pacc" }).primaryKey(),
    external_id: model.text().nullable(),
    status: model.enum(PayoutAccountStatus).default(PayoutAccountStatus.PENDING),
    kyc_status: model.enum(PayoutKycStatus).nullable(),
    payouts_enabled: model.boolean().default(false),
    charges_enabled: model.boolean().default(false),
    details_submitted: model.boolean().default(false),
    disabled_reason: model.text().nullable(),
    onboarding_token: model.text().nullable(),
    onboarding_token_issued_at: model.dateTime().nullable(),
    last_synced_at: model.dateTime().nullable(),
    data: model.json().default({}),
    context: model.json().nullable(),
    onboarding: model
      .hasOne(() => Onboarding, {
        mappedBy: "account",
      })
      .nullable(),
    payouts: model.hasMany(() => Payout, {
      mappedBy: "account",
    }),
  })
  .indexes([
    {
      name: "IDX_payout_account_external_id",
      on: ["external_id"],
      unique: true,
      where: "deleted_at IS NULL AND external_id IS NOT NULL",
    },
    {
      name: "IDX_payout_account_onboarding_token",
      on: ["onboarding_token"],
      unique: true,
      where: "deleted_at IS NULL AND onboarding_token IS NOT NULL",
    },
  ]);
