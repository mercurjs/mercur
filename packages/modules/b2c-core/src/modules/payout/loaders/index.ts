import { LoaderOptions } from "@medusajs/framework/types";
import { StripePayoutProvider, AdyenPayoutProvider } from "../services";

export default async function payoutModuleLoader({
  container,
}: LoaderOptions): Promise<void> {
  // Register Stripe payout provider
  container.register({
    stripePayoutProvider: {
      resolve: () => {
        const logger = container.resolve("logger");
        const configModule = container.resolve("configModule");
        return new StripePayoutProvider({ logger, configModule });
      },
    },
  });

  // Register Adyen payout provider
  container.register({
    adyenPayoutProvider: {
      resolve: () => {
        const logger = container.resolve("logger");
        const configModule = container.resolve("configModule");
        return new AdyenPayoutProvider({ logger, configModule });
      },
    },
  });
}
