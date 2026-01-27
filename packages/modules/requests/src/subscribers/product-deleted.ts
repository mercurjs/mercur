import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';

import { ProductRequestUpdatedEvent } from '@mercurjs/framework';

import { REQUESTS_MODULE, RequestsModuleService } from '../modules/requests';

export default async function productDeletedHandler({
  event,
  container
}: SubscriberArgs<{ ids: string[] }>) {
  const requestService =
    container.resolve<RequestsModuleService>(REQUESTS_MODULE);

  const foundRequests = await requestService.listRequests({
    $or: [
      {
        data: {
          product_id: event.data.ids
        },
        status: 'pending'
      },
      {
        data: {
          id: event.data.ids
        },
        status: 'pending'
      }
    ]
  });

  await requestService.softDeleteRequests(
    foundRequests.map((request) => request.id)
  );
}

export const config: SubscriberConfig = {
  event: ProductRequestUpdatedEvent.DELETED,
  context: {
    subscriberId: 'product-deleted-handler'
  }
};
