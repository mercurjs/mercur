import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import {
  CreateRequestDTO,
  ProductRequestUpdatedEvent,
} from "@mercurjs/framework";
import {
  createProductRequestWorkflow,
} from "../workflows";

export default async function productRequestToCreateHandler({
  event,
  container,
}: SubscriberArgs<{
  data: CreateRequestDTO;
  seller_id: string;
}>) {
  const input = event.data;

  await createProductRequestWorkflow.run({
    container,
    input,
  });
}

export const config: SubscriberConfig = {
  event: ProductRequestUpdatedEvent.TO_CREATE,
  context: {
    subscriberId: "product-request-to-create",
  },
};
