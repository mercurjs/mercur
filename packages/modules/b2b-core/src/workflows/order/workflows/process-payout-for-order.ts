import { Modules } from "@medusajs/framework/utils";
import { transform, when } from "@medusajs/framework/workflows-sdk";
import {
  createRemoteLinkStep,
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import { createWorkflow } from "@medusajs/workflows-sdk";

import { PayoutWorkflowEvents } from "@mercurjs/framework";
import { PAYOUT_MODULE } from "../../../modules/payout";

import {
  calculatePayoutForOrderStep,
  createPayoutStep,
  validateNoExistingPayoutForOrderStep,
  validateSellerPayoutAccountStep,
} from "../steps";

type ProcessPayoutForOrderWorkflowInput = {
  order_id: string;
};

export const processPayoutForOrderWorkflow = createWorkflow(
  { name: "process-payout-for-order" },
  function (input: ProcessPayoutForOrderWorkflowInput) {
    validateNoExistingPayoutForOrderStep(input.order_id);

    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "seller.id",
        "total",
        "currency_code",
        "payment_collections.payment_sessions.*",
      ],
      filters: {
        id: input.order_id,
      },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "query-order" });

    const order = transform(orders, (orders) => {
      const transformed = orders[0];

      return {
        seller_id: transformed.seller.id,
        id: transformed.id,
        total: transformed.total,
        currency_code: transformed.currency_code,
        source_transaction:
          transformed.payment_collections[0].payment_sessions[0].data
            .latest_charge,
      };
    });

    const { data: sellers } = useQueryGraphStep({
      entity: "seller",
      fields: ["*", "payout_account.*"],
      filters: {
        id: order.seller_id,
      },
    }).config({ name: "query-seller" });

    const seller = transform(sellers, (sellers) => sellers[0]);

    validateSellerPayoutAccountStep(seller);

    const payout_total = calculatePayoutForOrderStep(input);

    const { payout, err: createPayoutErr } = createPayoutStep({
      transaction_id: order.id,
      amount: payout_total,
      currency_code: order.currency_code,
      account_id: seller.payout_account.id,
      source_transaction: order.source_transaction,
    });

    when({ createPayoutErr }, ({ createPayoutErr }) => !createPayoutErr).then(
      () => {
        createRemoteLinkStep([
          {
            [Modules.ORDER]: {
              order_id: order.id,
            },
            [PAYOUT_MODULE]: {
              payout_id: payout!.id,
            },
          },
        ]);

        emitEventStep({
          eventName: PayoutWorkflowEvents.SUCCEEDED,
          data: {
            id: payout!.id,
            order_id: order.id,
          },
        }).config({ name: "emit-payout-succeeded" });
      }
    );

    when({ createPayoutErr }, ({ createPayoutErr }) => createPayoutErr).then(
      () => {
        emitEventStep({
          eventName: PayoutWorkflowEvents.FAILED,
          data: {
            order_id: order.id,
          },
        }).config({ name: "emit-payout-failed" });
      }
    );
  }
);
