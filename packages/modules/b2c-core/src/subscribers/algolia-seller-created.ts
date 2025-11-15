import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { AlgoliaEvents, Modules, SellerEvents } from '@mercurjs/framework'

export default async function sellerCreatedHandler({
    event,
    container
}: SubscriberArgs<{ ids: string[] }>) {
    const eventBus = container.resolve(Modules.EVENT_BUS)

    await eventBus.emit({
        name: AlgoliaEvents.SELLERS_CHANGED,
        data: { ids: event.data.ids }
    })
}

export const config: SubscriberConfig = {
    event: SellerEvents.SELLER_CREATED,
    context: {
        subscriberId: 'seller-created-handler'
    }
}