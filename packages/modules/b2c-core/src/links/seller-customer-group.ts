import { defineLink } from '@medusajs/framework/utils'
import CustomerModule from '@medusajs/medusa/customer'

import SellerModule from '../modules/seller'

export default defineLink(
  {
    linkable: SellerModule.linkable.seller,
    filterable: ['id', 'name', 'created_at', 'updated_at', 'deleted_at']
  },
  {
    linkable: CustomerModule.linkable.customerGroup,
    isList: true,
    filterable: ['id', 'name', 'created_at', 'updated_at', 'deleted_at']
  }
)
