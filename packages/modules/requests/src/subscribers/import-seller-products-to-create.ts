import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import {
  CreateRequestDTO,
  ImportSellerProductsRequestUpdatedEvent,
} from "@mercurjs/framework";
import {
  importSellerProductsRequestWorkflow,
} from "../workflows";

export default async function sellerCreationRequestToCreateHandler({
  event,
  container,
}: SubscriberArgs<{
  seller_id: string;
  request_payloads: CreateRequestDTO[];
}>) {
  const input = event.data;

  await importSellerProductsRequestWorkflow.run({
    container,
    input,
  });
}

export const config: SubscriberConfig = {
  event: ImportSellerProductsRequestUpdatedEvent.TO_CREATE,
  context: {
    subscriberId: "import-seller-products-to-create",
  },
};
