import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { CreateRequestDTO, SellerRequest } from "@mercurjs/framework";
import { createSellerCreationRequestWorkflow } from "../workflows";

export default async function sellerCreationRequestToCreateHandler({
  event,
  container,
}: SubscriberArgs<CreateRequestDTO>) {
  const input = event.data;

  await createSellerCreationRequestWorkflow.run({
    container,
    input,
  });
}

export const config: SubscriberConfig = {
  event: SellerRequest.TO_CREATE,
  context: {
    subscriberId: "seller-creation-request-to-create",
  },
};
