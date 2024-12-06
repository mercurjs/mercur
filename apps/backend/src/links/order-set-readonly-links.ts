import { MARKETPLACE_MODULE } from '#/modules/marketplace'

import { MedusaModule } from '@medusajs/framework/modules-sdk'
import { Modules } from '@medusajs/framework/utils'

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
    }
  ]
})
