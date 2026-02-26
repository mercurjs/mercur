import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { ALGOLIA_MODULE, AlgoliaModuleService } from "../modules/algolia";
import { AlgoliaEvents, IndexType } from "@mercurjs/framework";

import {
  filterSellersByStatus,
  findAndTransformAlgoliaSellers,
} from "./utils";

export default async function algoliaSellersChangedHandler({
  event,
  container,
}: SubscriberArgs<{ ids: string[] }>) {
  const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE);

  const { actives, other } = await filterSellersByStatus(
    container,
    event.data.ids
  );

  const sellersToInsert = actives.length
    ? await findAndTransformAlgoliaSellers(container, actives)
    : [];

  await algolia.batch(IndexType.SELLER, sellersToInsert, other);
}

export const config: SubscriberConfig = {
  event: AlgoliaEvents.SELLERS_CHANGED,
  context: {
    subscriberId: "algolia-sellers-changed-handler",
  },
};
