import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import {
  RequestDTO,
  SellerAccountRequestUpdatedEvent,
} from "@mercurjs/framework";

import { createSellerWorkflow } from "../workflows";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function sellerCreationRequestAcceptedHandler({
  event,
  container,
}: SubscriberArgs<RequestDTO>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const request = event.data;

  const { result: seller } = await createSellerWorkflow.run({
    container,
    input: {
      member: request.data.member as any,
      seller: request.data.seller as any,
      auth_identity_id: request.data.auth_identity_id as string,
    },
  });

  logger.info(
    `Seller creation request accepted: ${request.id}, seller: ${seller.id}`
  );
}

export const config: SubscriberConfig = {
  event: SellerAccountRequestUpdatedEvent.ACCEPTED,
  context: {
    subscriberId: "seller-creation-request-accepted-handler",
  },
};
