import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import sellerPayoutAccountLink from "../../../links/seller-payout-account";
import { PaymentProvider } from "../../../api/vendor/payout-account/types";

type ValidatePayoutAccountExistsForSellerInput = {
  seller_id: string;
  payment_provider_id: PaymentProvider;
};

export const validatePayoutAccountExistsForSellerStep = createStep(
  "validate-payout-account-exists-for-seller",
  async (input: ValidatePayoutAccountExistsForSellerInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: sellerPayoutAccountRelations } = await query.graph({
      entity: sellerPayoutAccountLink.entryPoint,
      fields: ["id", "payout_account_id", "payout_account.*"],
      filters: { seller_id: input.seller_id },
    });

    const matchingAccount = sellerPayoutAccountRelations.find(
      (relation: any) =>
        relation.payout_account?.payment_provider_id === input.payment_provider_id
    );

    if (!matchingAccount) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "No payment account exists for seller with the specified payment provider"
      );
    }

    return new StepResponse({
      id: matchingAccount.payout_account_id,
    });
  }
);
