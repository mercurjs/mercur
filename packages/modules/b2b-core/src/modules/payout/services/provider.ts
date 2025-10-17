import Stripe from "stripe";

import { ConfigModule, Logger } from "@medusajs/framework/types";
import { MedusaError, isPresent } from "@medusajs/framework/utils";

import { PAYOUT_MODULE } from "..";

import {
  CreatePayoutAccountInput,
  CreatePayoutAccountResponse,
  IPayoutProvider,
  InitializeOnboardingResponse,
  PayoutWebhookAction,
  PayoutWebhookActionPayload,
  ProcessPayoutInput,
  ProcessPayoutResponse,
  ReversePayoutInput,
  getSmallestUnit,
} from "@mercurjs/framework";

type InjectedDependencies = {
  logger: Logger;
  configModule: ConfigModule;
};

type StripeConnectConfig = {
  apiKey: string;
  webhookSecret: string;
};

export class PayoutProvider implements IPayoutProvider {
  protected readonly config_: StripeConnectConfig;
  protected readonly logger_: Logger;
  protected readonly client_: Stripe;

  constructor({ logger, configModule }: InjectedDependencies) {
    this.logger_ = logger;

    const moduleDef = configModule.modules?.[PAYOUT_MODULE];
    if (typeof moduleDef !== "boolean" && moduleDef?.options) {
      this.config_ = {
        apiKey: process.env.STRIPE_SECRET_API_KEY as string,
        webhookSecret: process.env
          .STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET as string,
      };
    }

    this.client_ = new Stripe(this.config_.apiKey, {
      // @ts-ignore
      apiVersion: "2025-02-24.acacia",
    });
  }

  async createPayout({
    amount,
    currency,
    account_reference_id,
    transaction_id,
    source_transaction,
  }: ProcessPayoutInput): Promise<ProcessPayoutResponse> {
    try {
      this.logger_.info(
        `Processing payout for transaction with ID ${transaction_id}`
      );

      const transfer = await this.client_.transfers.create(
        {
          currency,
          destination: account_reference_id,
          amount: getSmallestUnit(amount, currency),
          source_transaction,
          metadata: {
            transaction_id,
          },
        },
        { idempotencyKey: transaction_id }
      );

      return {
        data: transfer as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logger_.error("Error occured while creating payout", error);

      const message = error?.message ?? "Error occured while creating payout";

      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message);
    }
  }

  async createPayoutAccount({
    context,
    account_id,
  }: CreatePayoutAccountInput): Promise<CreatePayoutAccountResponse> {
    try {
      const { country } = context;
      this.logger_.info("Creating payment profile");

      if (!isPresent(country)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `"country" is required`
        );
      }

      const account = await this.client_.accounts.create({
        country: country as string,
        type: "standard",
        metadata: {
          account_id,
        },
      });

      return {
        data: account as unknown as Record<string, unknown>,
        id: account.id,
      };
    } catch (error) {
      const message =
        error?.message ?? "Error occured while creating payout account";
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message);
    }
  }

  async initializeOnboarding(
    accountId: string,
    context: Record<string, unknown>
  ): Promise<InitializeOnboardingResponse> {
    try {
      this.logger_.info("Initializing onboarding");

      if (!isPresent(context.refresh_url)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `'refresh_url' is required`
        );
      }

      if (!isPresent(context.return_url)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `'return_url' is required`
        );
      }

      const accountLink = await this.client_.accountLinks.create({
        account: accountId,
        refresh_url: context.refresh_url as string,
        return_url: context.return_url as string,
        type: "account_onboarding",
      });

      return {
        data: accountLink as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const message =
        error?.message ?? "Error occured while initializing onboarding";
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message);
    }
  }

  async getAccount(accountId: string): Promise<Stripe.Account> {
    try {
      const account = await this.client_.accounts.retrieve(accountId);
      return account;
    } catch (error) {
      const message = error?.message ?? "Error occured while getting account";
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message);
    }
  }

  async reversePayout(input: ReversePayoutInput) {
    try {
      const reversal = await this.client_.transfers.createReversal(
        input.transfer_id,
        {
          amount: getSmallestUnit(input.amount, input.currency),
        }
      );

      return reversal;
    } catch (error) {
      const message = error?.message ?? "Error occured while reversing payout";
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message);
    }
  }

  async getWebhookActionAndData(payload: PayoutWebhookActionPayload) {
    const signature = payload.headers["stripe-signature"] as string;

    const event = this.client_.webhooks.constructEvent(
      payload.rawData as string | Buffer,
      signature,
      this.config_.webhookSecret
    );

    const data = event.data.object as Stripe.Account;

    switch (event.type) {
      case "account.updated":
        // here you can validate account data to make sure it's valid
        return {
          action: PayoutWebhookAction.ACCOUNT_AUTHORIZED,
          data: {
            account_id: data.metadata?.account_id as string,
          },
        };
    }

    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Unsupported event type: ${event.type}`
    );
  }
}
