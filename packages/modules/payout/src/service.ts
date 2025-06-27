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

type InjectedDependencies = {
  payoutProvider: IPayoutProvider;
};

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

  async getWebhookActionAndData(input: PayoutWebhookActionPayload) {
    return await this.provider_.getWebhookActionAndData(input);
  }
}

export default PayoutModuleService;
