import { model } from "@medusajs/framework/utils";

import { PayoutAccountStatus, PayoutKycStatus } from "@mercurjs/types";
import { Onboarding } from "./onboarding";
import { Payout } from "./payout";

export const PayoutAccount = model
  .define("payout_account", {
    id: model.id({ prefix: "pacc" }).primaryKey(),
    provider_account_id: model.text().nullable(),
    status: model.enum(PayoutAccountStatus).default(PayoutAccountStatus.PENDING),
    kyc_status: model.enum(PayoutKycStatus).nullable(),
    payouts_enabled: model.boolean().default(false),
    charges_enabled: model.boolean().default(false),
    details_submitted: model.boolean().default(false),
    disabled_reason: model.text().nullable(),
    requirements: model.json().nullable(),
    onboarding_token: model.text().nullable(),
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
      name: "IDX_payout_account_provider_account_id",
      on: ["provider_account_id"],
      unique: true,
      where: "deleted_at IS NULL AND provider_account_id IS NOT NULL",
    },
    {
      name: "IDX_payout_account_onboarding_token",
      on: ["onboarding_token"],
      unique: true,
      where: "deleted_at IS NULL AND onboarding_token IS NOT NULL",
    },
  ]);
