import AdyenConnectProvider from "../core/adyen-connect-provider";
import { PaymentIntentOptions, PaymentProviderKeys } from "@mercurjs/framework";

class AdyenConnectCardProviderService extends AdyenConnectProvider {
  static identifier = PaymentProviderKeys.CARD;

  constructor(_, options) {
    super(_, options);
  }

  get paymentIntentOptions(): PaymentIntentOptions {
    return {
      payment_method_types: ["card"],
    };
  }
}

export default AdyenConnectCardProviderService;
