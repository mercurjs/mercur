import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";
import { WorkflowResponse, createWorkflow } from "@medusajs/workflows-sdk";

import { CreatePayoutAccountDTO } from "@mercurjs/framework";
import { PAYOUT_MODULE } from "../../../modules/payout";
import { SELLER_MODULE } from "../../../modules/seller";

import {
  createPayoutAccountStep,
  validateNoExistingPayoutAccountForSellerStep,
} from "../steps";

type CreatePayoutAccountForSellerInput = {
  context: CreatePayoutAccountDTO["context"];
  seller_id: string;
};

export const createPayoutAccountForSellerWorkflow = createWorkflow(
  {
    name: "create-payout-account-for-seller",
    idempotent: true,
  },
  function (input: CreatePayoutAccountForSellerInput) {
    validateNoExistingPayoutAccountForSellerStep(input.seller_id);

    const payoutAccount = createPayoutAccountStep({ context: input.context });

    createRemoteLinkStep([
      {
        [SELLER_MODULE]: {
          seller_id: input.seller_id,
        },
        [PAYOUT_MODULE]: {
          payout_account_id: payoutAccount.id,
        },
      },
    ]);

    return new WorkflowResponse(payoutAccount);
  }
);
