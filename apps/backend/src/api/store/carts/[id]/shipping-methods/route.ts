import { addSellerShippingMethodToCartWorkflow } from '#/workflows/cart/workflows'

import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { StoreAddCartShippingMethodsType } from '@medusajs/medusa/api/store/carts/validators'

export const POST = async (
  req: MedusaRequest<StoreAddCartShippingMethodsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await addSellerShippingMethodToCartWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      option: {
        id: req.validatedBody.option_id,
        data: req.validatedBody.data
      }
    }
  })

  const {
    data: [cart]
  } = await query.graph({
    entity: 'cart',
    filters: {
      id: req.params.id
    },
    fields: req.queryConfig.fields
  })

  res.json({ cart })
}
