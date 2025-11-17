import { EntityManager } from "@mikro-orm/knex";
import { Types } from "@adyen/api-library";

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
import { PaymentProvider } from "../../api/vendor/payout-account/types";

type InjectedDependencies = {
  stripePayoutProvider: IPayoutProvider;
  adyenPayoutProvider: IPayoutProvider;
};

class PayoutModuleService extends MedusaService({
  Payout,
  PayoutReversal,
  PayoutAccount,
  Onboarding,
}) {
  protected providers_: Map<string, IPayoutProvider>;

  constructor({
    stripePayoutProvider,
    adyenPayoutProvider,
  }: InjectedDependencies) {
    super(...arguments);
    this.providers_ = new Map([
      [PaymentProvider.STRIPE_CONNECT, stripePayoutProvider],
      [PaymentProvider.ADYEN_CONNECT, adyenPayoutProvider],
    ]);
  }

  protected getProvider(payment_provider_id: string): IPayoutProvider {
    const provider = this.providers_.get(payment_provider_id);
    if (!provider) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Payment provider ${payment_provider_id} not found`
      );
    }
    return provider;
  }

  @InjectTransactionManager()
  async createPayoutAccount(
    params: CreatePayoutAccountDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const result = await this.createPayoutAccounts(
      {
        context: params.context,
        payment_provider_id: params.payment_provider_id as PaymentProvider,
        reference_id: "placeholder",
        data: {},
      },
      sharedContext
    );

    try {
      const provider = this.getProvider(params.payment_provider_id);
      const { data, id: referenceId } = await provider.createPayoutAccount({
        context: params.context,
        payment_provider_id: params.payment_provider_id,
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
  async syncPayoutAccount(
    account_id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const payout_account = await this.retrievePayoutAccount(account_id);

    if (!payout_account.payment_provider_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Payout account missing payment_provider_id"
      );
    }

    const provider = this.getProvider(payout_account.payment_provider_id);
    const account_data = await provider.getAccount(payout_account.reference_id);

    // Provider-specific status logic
    let status = PayoutAccountStatus.PENDING;

    // For Stripe
    if (payout_account.payment_provider_id === PaymentProvider.STRIPE_CONNECT) {
      const stripe_account = account_data as any;
      status =
        stripe_account.details_submitted &&
        stripe_account.payouts_enabled &&
        stripe_account.charges_enabled &&
        stripe_account.tos_acceptance &&
        stripe_account.tos_acceptance?.date !== null
          ? PayoutAccountStatus.ACTIVE
          : PayoutAccountStatus.PENDING;
    }
    // For Adyen
    else if (
      payout_account.payment_provider_id === PaymentProvider.ADYEN_CONNECT
    ) {
      const adyen_entity =
        account_data as unknown as Types.legalEntityManagement.LegalEntity;

      const hasPayoutCapability =
        adyen_entity.capabilities?.sendToTransferInstrument.allowed === true &&
        adyen_entity.capabilities?.receiveFromTransferInstrument.allowed ===
          true &&
        adyen_entity.capabilities?.sendToBalanceAccount.allowed === true &&
        adyen_entity.capabilities?.receivePayments.allowed === true &&
        adyen_entity.capabilities?.receiveFromPlatformPayments.allowed ===
          true &&
        adyen_entity.capabilities?.receiveFromBalanceAccount.allowed === true;

      status = hasPayoutCapability
        ? PayoutAccountStatus.ACTIVE
        : PayoutAccountStatus.PENDING;
    }

    if (payout_account.payment_provider_id === PaymentProvider.ADYEN_CONNECT) {
      // NOTE:
      // In case of Adyen, we also store other information in the payout_account.data,
      // such as the balance account, account holder, business line, store, and so on.
      // We MUST NOT overwrite the whole data,
      // but only the legal_entity with the account_data (which is the newly retrieved legal entity from Adyen).
      const new_account_data = {
        ...payout_account.data,
        legal_entity: account_data,
      };

      await this.updatePayoutAccounts(
        {
          id: account_id,
          data: new_account_data,
          status,
        },
        sharedContext
      );
    } else {
      // Normally overwrite the whole data.
      await this.updatePayoutAccounts(
        {
          id: account_id,
          data: account_data,
          status,
        },
        sharedContext
      );
    }

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

    if (!account.payment_provider_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Payout account missing payment_provider_id"
      );
    }

    const provider = this.getProvider(account.payment_provider_id);
    const { data: providerData } = await provider.initializeOnboarding(
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
      commission_amount,
      currency_code,
      account_id,
      transaction_id,
      source_transaction,
      payment_session,
    } = input;

    const payoutAccount = await this.retrievePayoutAccount(account_id);

    if (!payoutAccount.payment_provider_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Payout account missing payment_provider_id"
      );
    }

    const provider = this.getProvider(payoutAccount.payment_provider_id);
    const { data } = await provider.createPayout({
      account_reference_id: payoutAccount.reference_id,
      amount,
      commission_amount,
      currency: currency_code,
      transaction_id,
      source_transaction,
      payment_session,
    });

    // @ts-expect-error BigNumber incompatible interface
    const payout = await this.createPayouts(
      {
        data,
        amount,
        commission_amount,
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
    const payout = await this.retrievePayout(input.payout_id, {
      relations: ["payout_account"],
    });

    if (!payout || !payout.data || !payout.data.id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Payout not found");
    }

    if (!payout.payout_account?.payment_provider_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Payout account missing payment_provider_id"
      );
    }

    const transfer_id = payout.data.id as string;

    const provider = this.getProvider(
      payout.payout_account.payment_provider_id
    );
    const transferReversal = await provider.reversePayout({
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

  async getWebhookActionAndData(
    payment_provider_id: string,
    input: PayoutWebhookActionPayload
  ) {
    const provider = this.getProvider(payment_provider_id);
    return await provider.getWebhookActionAndData(input);
  }
}

export default PayoutModuleService;
