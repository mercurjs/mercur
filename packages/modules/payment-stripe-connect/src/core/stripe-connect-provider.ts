import Stripe from "stripe";

import {
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types";
import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
  isPresent,
} from "@medusajs/framework/utils";
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
} from "@medusajs/types";

import {
  getAmountFromSmallestUnit,
  getSmallestUnit,
  ErrorCodes,
  ErrorIntentStatus,
  PaymentIntentOptions,
} from "@mercurjs/framework";

type Options = {
  apiKey: string;
  webhookSecret: string;
};

abstract class StripeConnectProvider extends AbstractPaymentProvider<Options> {
  private readonly options_: Options;
  private readonly client_: Stripe;

  constructor(container, options: Options) {
    super(container);

    this.options_ = options;

    this.client_ = new Stripe(options.apiKey);
  }

  abstract get paymentIntentOptions(): PaymentIntentOptions;

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const id = input.data?.id as string;
    const paymentIntent = await this.client_.paymentIntents.retrieve(id);
    const dataResponse = paymentIntent as unknown as Record<string, unknown>;

    switch (paymentIntent.status) {
      case "requires_payment_method":
      case "requires_confirmation":
      case "processing":
        return { status: PaymentSessionStatus.PENDING, data: dataResponse };
      case "requires_action":
        return {
          status: PaymentSessionStatus.REQUIRES_MORE,
          data: dataResponse,
        };
      case "canceled":
        return { status: PaymentSessionStatus.CANCELED, data: dataResponse };
      case "requires_capture":
        return { status: PaymentSessionStatus.AUTHORIZED, data: dataResponse };
      case "succeeded":
        return { status: PaymentSessionStatus.CAPTURED, data: dataResponse };
      default:
        return { status: PaymentSessionStatus.PENDING, data: dataResponse };
    }
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code } = input;

    const email = input.context?.customer?.email;

    const paymentIntentInput: Stripe.PaymentIntentCreateParams = {
      ...this.paymentIntentOptions,
      currency: currency_code,
      amount: getSmallestUnit(amount, currency_code),
    };

    // revisit when you could update customer using initiatePayment
    try {
      const {
        data: [customer],
      } = await this.client_.customers.list({
        email,
        limit: 1,
      });

      if (customer) {
        paymentIntentInput.customer = customer.id;
      }
    } catch (error) {
      throw this.buildError(
        "An error occurred in initiatePayment when retrieving a Stripe customer",
        error
      );
    }

    if (!paymentIntentInput.customer) {
      try {
        const customer = await this.client_.customers.create({ email });
        paymentIntentInput.customer = customer.id;
      } catch (error) {
        throw this.buildError(
          "An error occurred in initiatePayment when creating a Stripe customer",
          error
        );
      }
    }

    try {
      const data = (await this.client_.paymentIntents.create(
        paymentIntentInput
      )) as any;

      return {
        id: data.id,
        data,
      };
    } catch (error) {
      throw this.buildError(
        "An error occurred in initiatePayment when creating a Stripe payment intent",
        error
      );
    }
  }

  async authorizePayment(
    data: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const result = await this.getPaymentStatus(data);
    if (result.status === PaymentSessionStatus.CAPTURED) {
      return { status: PaymentSessionStatus.AUTHORIZED, data: result.data };
    }

    return result;
  }

  async cancelPayment({
    data: paymentSessionData,
  }: CancelPaymentInput): Promise<CancelPaymentOutput> {
    try {
      const id = paymentSessionData?.id as string;

      if (!id) {
        return { data: paymentSessionData };
      }

      const data = (await this.client_.paymentIntents.cancel(id)) as any;
      return { data };
    } catch (error) {
      throw this.buildError("An error occurred in cancelPayment", error);
    }
  }

  async capturePayment({
    data: paymentSessionData,
  }: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const id = paymentSessionData?.id as string;
    try {
      const data = (await this.client_.paymentIntents.capture(id)) as any;
      return { data };
    } catch (error) {
      if (error.code === ErrorCodes.PAYMENT_INTENT_UNEXPECTED_STATE) {
        if (error.payment_intent?.status === ErrorIntentStatus.SUCCEEDED) {
          return { data: error.payment_intent };
        }
      }
      throw this.buildError("An error occurred in capturePayment", error);
    }
  }

  deletePayment(data: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return this.cancelPayment(data);
  }

  async refundPayment({
    data: paymentSessionData,
    amount,
  }: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const id = paymentSessionData?.id as string;

    try {
      const currency = paymentSessionData?.currency as string;
      await this.client_.refunds.create({
        amount: getSmallestUnit(amount, currency),
        payment_intent: id as string,
      });
    } catch (e) {
      throw this.buildError("An error occurred in refundPayment", e);
    }

    return { data: paymentSessionData };
  }

  async retrievePayment({
    data: paymentSessionData,
  }: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    try {
      const id = paymentSessionData?.id as string;
      const intent = (await this.client_.paymentIntents.retrieve(id)) as any;

      intent.amount = getAmountFromSmallestUnit(intent.amount, intent.currency);
      console.log("Stripe - retrieving", intent);
      return { data: intent };
    } catch (e) {
      throw this.buildError("An error occurred in retrievePayment", e);
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const { data, amount, currency_code } = input;

    const amountNumeric = getSmallestUnit(amount, currency_code);

    if (isPresent(amount) && data?.amount === amountNumeric) {
      return { data };
    }

    try {
      const id = data?.id as string;
      const sessionData = (await this.client_.paymentIntents.update(id, {
        amount: amountNumeric,
      })) as any;

      return { data: sessionData };
    } catch (e) {
      throw this.buildError("An error occurred in updatePayment", e);
    }
  }

  async updatePaymentData(sessionId: string, data: Record<string, unknown>) {
    try {
      // Prevent from updating the amount from here as it should go through
      // the updatePayment method to perform the correct logic
      if (isPresent(data.amount)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot update amount, use updatePayment instead"
        );
      }

      return (await this.client_.paymentIntents.update(sessionId, {
        ...data,
      })) as any;
    } catch (e) {
      throw this.buildError("An error occurred in updatePaymentData", e);
    }
  }

  async getWebhookActionAndData(
    webhookData: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const event = this.constructWebhookEvent(webhookData);
    const intent = event.data.object as Stripe.PaymentIntent;

    const { currency } = intent;
    switch (event.type) {
      case "payment_intent.amount_capturable_updated":
        return {
          action: PaymentActions.AUTHORIZED,
          data: {
            session_id: intent.metadata.session_id,
            amount: getAmountFromSmallestUnit(
              intent.amount_capturable,
              currency
            ),
          },
        };
      case "payment_intent.succeeded":
        return {
          action: PaymentActions.SUCCESSFUL,
          data: {
            session_id: intent.metadata.session_id,
            amount: getAmountFromSmallestUnit(intent.amount_received, currency),
          },
        };
      case "payment_intent.payment_failed":
        return {
          action: PaymentActions.FAILED,
          data: {
            session_id: intent.metadata.session_id,
            amount: getAmountFromSmallestUnit(intent.amount, currency),
          },
        };
      default:
        return { action: PaymentActions.NOT_SUPPORTED };
    }
  }

  constructWebhookEvent(data: ProviderWebhookPayload["payload"]): Stripe.Event {
    const signature = data.headers["stripe-signature"] as string;

    return this.client_.webhooks.constructEvent(
      data.rawData as string | Buffer,
      signature,
      this.options_.webhookSecret
    );
  }

  private buildError(message: string, error: Error) {
    return new MedusaError(
      MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
      `${message}: ${error}`
    );
  }
}

export default StripeConnectProvider;
