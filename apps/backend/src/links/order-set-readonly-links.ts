import { MedusaModule } from '@medusajs/framework/modules-sdk'
import { Modules } from '@medusajs/framework/utils'

import { MARKETPLACE_MODULE } from '@mercurjs/marketplace'

MedusaModule.setCustomLink({
  isLink: true,
  isReadOnlyLink: true,
  extends: [
    {
      serviceName: MARKETPLACE_MODULE,
      relationship: {
        serviceName: Modules.CUSTOMER,
        entity: 'Customer',
        primaryKey: 'id',
        foreignKey: 'customer_id',
        alias: 'customer'
      }
    },
    {
      serviceName: MARKETPLACE_MODULE,
      relationship: {
        serviceName: Modules.CART,
        entity: 'Cart',
        primaryKey: 'id',
        foreignKey: 'cart_id',
        alias: 'cart'
      }
    },
    {
      serviceName: MARKETPLACE_MODULE,
      relationship: {
        serviceName: Modules.SALES_CHANNEL,
        entity: 'SalesChannel',
        primaryKey: 'id',
        foreignKey: 'sales_channel_id',
        alias: 'sales_channel'
      }
    },
    {
      serviceName: MARKETPLACE_MODULE,
      relationship: {
        serviceName: Modules.PAYMENT,
        entity: 'PaymentCollection',
        primaryKey: 'id',
        foreignKey: 'payment_collection_id',
        alias: 'payment_collection'
      }
    }
  ]
})
