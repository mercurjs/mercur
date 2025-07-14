import Stripe from "stripe";

import { BigNumberInput } from "@medusajs/framework/types";

import { PayoutWebhookAction } from "./events";

/**
 * *
 * @interface
 * 
 * Process payout input
 * @property {BigNumberInput} amount - The amount of the process payout input
 * @property {string} currency - The currency of the process payout input
 * @property {string} account_reference_id - The associated account reference's ID.
 * @property {string} transaction_id - The associated transaction's ID.
 * @property {string} source_transaction - The source transaction of the process payout input

 */
export type ProcessPayoutInput = {
  /**
 * *
 * SUMMARY

 */
  amount: BigNumberInput;
  /**
 * *
 * SUMMARY

 */
  currency: string;
  /**
 * *
 * The associated account reference's ID.

 */
  account_reference_id: string;
  /**
 * *
 * The associated transaction's ID.

 */
  transaction_id: string;
  /**
 * *
 * SUMMARY

 */
  source_transaction: string;
};

/**
 * *
 * @interface
 * 
 * Reverse payout input
 * @property {string} transfer_id - The associated transfer's ID.
 * @property {BigNumberInput} amount - The amount of the reverse payout input
 * @property {string} currency - The currency of the reverse payout input

 */
export type ReversePayoutInput = {
  /**
 * *
 * The associated transfer's ID.

 */
  transfer_id: string;
  /**
 * *
 * SUMMARY

 */
  amount: BigNumberInput;
  /**
 * *
 * SUMMARY

 */
  currency: string;
};

/**
 * *
 * @interface
 * 
 * Process payout response
 * @property {Record<string, unknown>} data - The data of the process payout response

 */
export type ProcessPayoutResponse = {
  /**
 * *
 * Construct a type with a set of properties K of type T

 */
  data: Record<string, unknown>;
};

/**
 * *
 * @interface
 * 
 * Create payout account input
 * @property {Record<string, unknown>} context - The context of the payout account input
 * @property {string} account_id - The associated account's ID.

 */
export type CreatePayoutAccountInput = {
  /**
 * *
 * Construct a type with a set of properties K of type T

 */
  context: Record<string, unknown>;
  /**
 * *
 * The associated account's ID.

 */
  account_id: string;
};

/**
 * *
 * @interface
 * 
 * Create payout account response
 * @property {Record<string, unknown>} data - The data of the payout account response
 * @property {string} id - The ID of the payout account response.

 */
export type CreatePayoutAccountResponse = {
  /**
 * *
 * Construct a type with a set of properties K of type T

 */
  data: Record<string, unknown>;
  /**
 * *
 * The ID of the entity.

 */
  id: string;
};

/**
 * *
 * @interface
 * 
 * Payout webhook action payload
 * @property {Record<string, unknown>} data - The data of the payout webhook action payload
 * @property {string | Buffer<ArrayBufferLike>} rawData - The rawdata of the payout webhook action payload
 * @property {Record<string, unknown>} headers - The headers of the payout webhook action payload

 */
export type PayoutWebhookActionPayload = {
  /**
 * *
 * Construct a type with a set of properties K of type T

 */
  data: Record<string, unknown>;
  /**
 * *
 * SUMMARY

 */
  rawData: string | Buffer;
  /**
 * *
 * Construct a type with a set of properties K of type T

 */
  headers: Record<string, unknown>;
};

/**
 * *
 * @interface
 * 
 * SUMMARY
 * @property {PayoutWebhookAction} action - The action of the payout webhook action and data response
 * @property {{ account_id: string; }} data - The data of the payout webhook action and data response

 */
export type PayoutWebhookActionAndDataResponse = {
  /**
 * *
 * SUMMARY

 */
  action: PayoutWebhookAction;
  /**
 * *
 * SUMMARY

 */
  data: {
    /**
 * *
 * The associated account's ID.

 */
    account_id: string;
  };
};

/**
 * *
 * @interface
 * 
 * SUMMARY
 * @property {Record<string, unknown>} data - The data of the initialize onboarding response

 */
export type InitializeOnboardingResponse = {
  /**
 * *
 * Construct a type with a set of properties K of type T

 */
  data: Record<string, unknown>;
};

/**
 * *
 * @interface
 *
 * Payout provider interface
 * @method createPayout - This method creates a payout.
 * @method createPayoutAccount - This method creates a payout account.
 * @method reversePayout - This method reverses a payout.
 * @method initializeOnboarding - This method initializes the onboarding process for a payout account.
 * @method getAccount - This method gets an account.
 * @method getWebhookActionAndData - This method gets the webhook action and data.
 */
export interface IPayoutProvider {
  /**
 * *
 * This method creates a payout.
 * 
 * @param {ProcessPayoutInput} input - Details needed to initiate a payout transaction.
 * @returns {Promise<ProcessPayoutResponse>} The created payout.

 */
  createPayout(input: ProcessPayoutInput): Promise<ProcessPayoutResponse>;
  /**
 * *
 * This method creates a payout account.
 * 
 * @param {CreatePayoutAccountInput} input - Details for setting up a seller's payout account
 * @returns {Promise<CreatePayoutAccountResponse>} The created payout account.

 */
  createPayoutAccount(
    input: CreatePayoutAccountInput
  ): Promise<CreatePayoutAccountResponse>;
  /**
 * *
 * This method Represents the completion of an asynchronous operation
 * 
 * @param {ReversePayoutInput} input - Details for initiating a payout reversal in Stripe.
 * @returns {Promise<TransferReversal>} Represents the completion of an asynchronous operation

 */
  reversePayout(input: ReversePayoutInput): Promise<Stripe.TransferReversal>;
  /**
   * Initialize the onboarding process for a payout account.
   */
  initializeOnboarding(
    accountId: string,
    context: Record<string, unknown>
  ): Promise<InitializeOnboardingResponse>;
  /**
 * *
 * This method Represents the completion of an asynchronous operation
 * 
 * @param {string} accountId - The account's ID.
 * @returns {Promise<Account>} Represents the completion of an asynchronous operation

 */
  getAccount(accountId: string): Promise<Stripe.Account>;
  /**
 * *
 * This method Represents the completion of an asynchronous operation
 * 
 * @param {PayoutWebhookActionPayload} payload - Webhook content for identifying payout events
 * @returns {Promise<PayoutWebhookActionAndDataResponse>} Represents the completion of an asynchronous operation

 */
  getWebhookActionAndData(
    payload: PayoutWebhookActionPayload
  ): Promise<PayoutWebhookActionAndDataResponse>;
}
