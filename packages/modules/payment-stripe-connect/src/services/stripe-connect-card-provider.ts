import StripeConnectProvider from "../core/stripe-connect-provider";
import { PaymentIntentOptions, PaymentProviderKeys } from "@mercurjs/framework";

/**
 * @class StripeConnectCardProviderService
 * @description Represents the Stripe Connect card provider service.
 */
class StripeConnectCardProviderService extends StripeConnectProvider {
  static identifier = PaymentProviderKeys.CARD;

  constructor(_, options) {
    super(_, options);
  }

  /**
 * @method getPaymentIntentOptions
 * @description This method returns the payment intent options.
 * 
 * @returns {PaymentIntentOptions} Payment intent options.

 */
  get paymentIntentOptions(): PaymentIntentOptions {
    return {
      payment_method_types: ["card"],
    };
  }
}

export default StripeConnectCardProviderService;
