import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import {
  addSellerShippingMethodToCartWorkflow,
  removeCartShippingMethodsWorkflow
} from '../../../../../workflows/cart/workflows'
import {
  StoreAddCartShippingMethodsWithSellerType,
  StoreDeleteCartShippingMethodsType
} from '../../validators'

export const POST = async (
  req: MedusaRequest<StoreAddCartShippingMethodsWithSellerType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await addSellerShippingMethodToCartWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      option: {
        id: req.validatedBody.option_id,
        data: req.validatedBody.data
      },
      seller_id: req.validatedBody.seller_id
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

export const DELETE = async (
  req: MedusaRequest<StoreDeleteCartShippingMethodsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await removeCartShippingMethodsWorkflow.run({
    container: req.scope,
    input: req.validatedBody
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
