import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { AlgoliaEvents, SellerEvents } from '@mercurjs/framework'
import { Modules } from '@medusajs/framework/utils'

export default async function sellerUpdatedHandler({
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
    event: SellerEvents.SELLER_UPDATED,
    context: {
        subscriberId: 'seller-updated-handler'
    }
}