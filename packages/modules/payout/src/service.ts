import { EntityManager } from "@mikro-orm/knex";

import { Context } from "@medusajs/framework/types";
import {
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils";

import { Onboarding, Payout, PayoutAccount, PayoutReversal } from "./models";
import {
  CreateOnboardingDTO,
  CreatePayoutAccountDTO,
  CreatePayoutDTO,
  CreatePayoutReversalDTO,
  IPayoutProvider,
  PayoutAccountStatus,
  PayoutWebhookActionPayload,
} from "@mercurjs/framework";

/**
 * @interface InjectedDependencies
 * @description Represents the dependencies for the payout module service.
 * @property {IPayoutProvider} payoutProvider - The associated payout provider.

 */
type InjectedDependencies = {
  payoutProvider: IPayoutProvider;
};

/**
 * @class PayoutModuleService
 * @description Represents the payout module service.
 */
class PayoutModuleService extends MedusaService({
  Payout,
  PayoutReversal,
  PayoutAccount,
  Onboarding,
}) {
  protected provider_: IPayoutProvider;

  constructor({ payoutProvider }: InjectedDependencies) {
    super(...arguments);
    this.provider_ = payoutProvider;
  }

  /**
 * *
 * This method creates a payout account.
 * 
 * @param {CreatePayoutAccountDTO} __0 - The payout account to be created.
 * @param {Context<SqlEntityManager<AbstractSqlDriver<AbstractSqlConnection, AbstractSqlPlatform>>>} sharedContext - Medusa transaction and entity management context
 * @returns {Promise<any>} The created payout account.

 */
  @InjectTransactionManager()
  async createPayoutAccount(
    { context }: CreatePayoutAccountDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const result = await this.createPayoutAccounts(
      { context, reference_id: "placeholder", data: {} },
      sharedContext
    );

    try {
      const { data, id: referenceId } =
        await this.provider_.createPayoutAccount({
          context,
          account_id: result.id,
        });

      await this.updatePayoutAccounts(
        {
          id: result.id,
          data,
          reference_id: referenceId,
        },
        sharedContext
      );

      const updated = await this.retrievePayoutAccount(
        result.id,
        undefined,
        sharedContext
      );
      return updated;
    } catch (error) {
      await this.deletePayoutAccounts(result.id, sharedContext);
      throw error;
    }
  }

  /**
 * @method syncStripeAccount
 * @description This method synchronizes a Stripe account with the payout account status
 * 
 * @param {string} account_id - Unique identifier for the seller's Stripe account.
 * @param {Context<SqlEntityManager<AbstractSqlDriver<AbstractSqlConnection, AbstractSqlPlatform>>>} sharedContext - Shared execution context for database transactions
 * @returns {Promise<any>} Represents the completion of an asynchronous operation

 */
  @InjectTransactionManager()
  async syncStripeAccount(
    account_id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const payout_account = await this.retrievePayoutAccount(account_id);
    const stripe_account = await this.provider_.getAccount(
      payout_account.reference_id
    );

    const status =
      stripe_account.details_submitted &&
      stripe_account.payouts_enabled &&
      stripe_account.charges_enabled &&
      stripe_account.tos_acceptance &&
      stripe_account.tos_acceptance?.date !== null;

    await this.updatePayoutAccounts(
      {
        id: account_id,
        data: stripe_account as unknown as Record<string, unknown>,
        status: status
          ? PayoutAccountStatus.ACTIVE
          : PayoutAccountStatus.PENDING,
      },
      sharedContext
    );

    const updated = await this.retrievePayoutAccount(
      account_id,
      undefined,
      sharedContext
    );
    return updated;
  }

  /**
 * @method initializeOnboarding
 * @description This method begins onboarding for a new payout account
 * 
 * @param {CreateOnboardingDTO} __0 - The onboarding to be created.
 * @param {Context<SqlEntityManager<AbstractSqlDriver<AbstractSqlConnection, AbstractSqlPlatform>>>} sharedContext - Common operational context across onboarding actions
 * @returns {Promise<any>} Represents the completion of an asynchronous operation

 */
  @InjectTransactionManager()
  async initializeOnboarding(
    { context, payout_account_id }: CreateOnboardingDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const [existingOnboarding] = await this.listOnboardings({
      payout_account_id,
    });
    const account = await this.retrievePayoutAccount(payout_account_id);

    const { data: providerData } = await this.provider_.initializeOnboarding(
      account.reference_id!,
      context
    );

    let onboarding = existingOnboarding;
    if (!existingOnboarding) {
      onboarding = await super.createOnboardings(
        {
          payout_account_id,
        },
        sharedContext
      );
    }

    await this.updateOnboardings(
      {
        id: onboarding.id,
        data: providerData,
        context,
      },
      sharedContext
    );

    return await this.retrieveOnboarding(
      onboarding.id,
      undefined,
      sharedContext
    );
  }

  /**
 * @method createPayout
 * @description This method creates a payout.
 * 
 * @param {CreatePayoutDTO} input - The payout to be created.
 * @param {Context<SqlEntityManager<AbstractSqlDriver<AbstractSqlConnection, AbstractSqlPlatform>>>} sharedContext - Shared Medusa transaction environment
 * @returns {Promise<any>} The created payout.

 */
  @InjectTransactionManager()
  async createPayout(
    input: CreatePayoutDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const {
      amount,
      currency_code,
      account_id,
      transaction_id,
      source_transaction,
    } = input;

    const payoutAccount = await this.retrievePayoutAccount(account_id);

    const { data } = await this.provider_.createPayout({
      account_reference_id: payoutAccount.reference_id,
      amount,
      currency: currency_code,
      transaction_id,
      source_transaction,
    });

    // @ts-expect-error BigNumber incompatible interface
    const payout = await this.createPayouts(
      {
        data,
        amount,
        currency_code,
        payout_account: payoutAccount.id,
      },
      sharedContext
    );

    return payout;
  }

  /**
 * @method createPayoutReversal
 * @description This method creates a payout reversal.
 * 
 * @param {CreatePayoutReversalDTO} input - The payout reversal to be created.
 * @param {Context<SqlEntityManager<AbstractSqlDriver<AbstractSqlConnection, AbstractSqlPlatform>>>} sharedContext - Shared transactional environment for database operations
 * @returns {Promise<any>} The created payout reversal.

 */
  @InjectTransactionManager()
  async createPayoutReversal(
    input: CreatePayoutReversalDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const payout = await this.retrievePayout(input.payout_id);

    if (!payout || !payout.data || !payout.data.id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Payout not found");
    }

    const transfer_id = payout.data.id as string;

    const transferReversal = await this.provider_.reversePayout({
      transfer_id,
      amount: input.amount,
      currency: input.currency_code,
    });

    // @ts-expect-error BigNumber incompatible interface
    const payoutReversal = await this.createPayoutReversals(
      {
        data: transferReversal as unknown as Record<string, unknown>,
        amount: input.amount,
        currency_code: input.currency_code,
        payout: payout.id,
      },
      sharedContext
    );

    return payoutReversal;
  }

  /**
 * @method getWebhookActionAndData
 * @description This method retrieves webhook action and associated details based on payload
 * 
 * @param {PayoutWebhookActionPayload} input - Payload from a payout-related webhook event
 * @returns {Promise<PayoutWebhookActionAndDataResponse>} Represents the completion of an asynchronous operation

 */
  async getWebhookActionAndData(input: PayoutWebhookActionPayload) {
    return await this.provider_.getWebhookActionAndData(input);
  }
}

export default PayoutModuleService;
