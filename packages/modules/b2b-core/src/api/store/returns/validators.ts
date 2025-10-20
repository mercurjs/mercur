import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export const StoreGetReturnsParams = createFindParams({
  offset: 0,
  limit: 50
})
