import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { updateProductsWorkflow } from '@medusajs/medusa/core-flows'

import sellerProduct from '../links/seller-product'
import { StoreStatus } from '../modules/seller/types'

type ProductStatus = 'draft' | 'proposed' | 'published' | 'rejected'

const STORE_STATUS_TO_PRODUCT_STATUS: Record<StoreStatus, ProductStatus> = {
  [StoreStatus.ACTIVE]: 'published',
  [StoreStatus.INACTIVE]: 'draft',
  [StoreStatus.SUSPENDED]: 'draft'
}

export default async function sellerStatusChangedHandler({
  event,
  container
}: SubscriberArgs<{ id: string; store_status: StoreStatus }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const targetProductStatus =
    STORE_STATUS_TO_PRODUCT_STATUS[event.data.store_status]

  if (!targetProductStatus) {
    return
  }

  const { data: products } = await query.graph({
    entity: sellerProduct.entryPoint,
    fields: ['product_id'],
    filters: {
      seller_id: event.data.id
    }
  })

  if (!products.length) {
    return
  }

  await updateProductsWorkflow(container).run({
    input: {
      update: { status: targetProductStatus },
      selector: {
        id: products.map((p) => p.id)
      }
    }
  })
}

export const config: SubscriberConfig = {
  event: 'seller.status_changed',
  context: {
    subscriberId: 'seller-status-changed-handler'
  }
}
