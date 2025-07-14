import { BigNumberInput } from "@medusajs/framework/types";

import { OnboardingDTO, PayoutAccountDTO } from "./common";

/**
 * *
 * @interface
 * The payout account to be created.
 * @property {Record<string, unknown>} context - The context of the payout account
 */
export interface CreatePayoutAccountDTO {
  /**
 * *
 * The context of the payout account

 */
  context: Record<string, unknown>;
}

/**
 * *
 * @interface
 *
 * The attributes to update in the payout account.
 * @property {string} id - The ID of the payout account.
 */
export interface UpdatePayoutAccountDTO
  extends Omit<Partial<PayoutAccountDTO>, "id" | "created_at" | "updated_at"> {
  /**
 * *
 * The ID of the payout account.

 */
  id: string;
}

/**
 * *
 * @interface
 * 
 * The onboarding to be created.
 * @property {string} payout_account_id - The associated payout account's ID.
 * @property {Record<string, unknown>} context - The context of the onboarding

 */
export interface CreateOnboardingDTO
  extends Omit<
    Partial<OnboardingDTO>,
    "id" | "created_at" | "updated_at" | "data"
  > {
  /**
 * *
 * The associated payout account's ID.

 */
  payout_account_id: string;
  /**
 * *
 * The context of the onboarding

 */
  context: Record<string, unknown>;
}

/**
 * *
 * @interface
 * 
 * The payout to be created.
 * @property {BigNumberInput} amount - The amount of the payout
 * @property {string} currency_code - The currency code of the payout
 * @property {string} account_id - The associated account's ID.
 * @property {string} transaction_id - The associated transaction's ID.
 * @property {string} source_transaction - The source transaction of the payout

 */
export type CreatePayoutDTO = {
  /**
 * *
 * The amount of the payout

 */
  amount: BigNumberInput;
  /**
 * *
 * The currency code of the payout

 */
  currency_code: string;
  /**
 * *
 * The associated account's ID.

 */
  account_id: string;
  /**
 * *
 * The associated transaction's ID.

 */
  transaction_id: string;
  /**
 * *
 * The source transaction of the payout

 */
  source_transaction: string;
};

/**
 * *
 * @interface
 * 
 * The payout reversal to be created.
 * @property {string} payout_id - The associated payout's ID.
 * @property {BigNumberInput} amount - The amount of the payout reversal
 * @property {string} currency_code - The currency code of the payout reversal

 */
export type CreatePayoutReversalDTO = {
  /**
 * *
 * The associated payout's ID.

 */
  payout_id: string;
  /**
 * *
 * The amount of the payout reversal

 */
  amount: BigNumberInput;
  /**
 * *
 * The currency code of the payout reversal

 */
  currency_code: string;
};
