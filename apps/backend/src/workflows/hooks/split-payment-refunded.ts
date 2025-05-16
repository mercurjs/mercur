import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { refundPaymentWorkflow } from '@medusajs/medusa/core-flows'

import { SPLIT_ORDER_PAYMENT_MODULE } from '../../modules/split-order-payment'
import SplitOrderPaymentModuleService from '../../modules/split-order-payment/service'
import { refundSplitOrderPaymentWorkflow } from '../split-order-payment/workflows'

refundSplitOrderPaymentWorkflow.hooks.splitPaymentRefunded(
  async ({ id, amount }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const splitPaymentService =
      container.resolve<SplitOrderPaymentModuleService>(
        SPLIT_ORDER_PAYMENT_MODULE
      )

    const splitPayment = await splitPaymentService.retrieveSplitOrderPayment(id)

    const {
      data: [payment_collection]
    } = await query.graph({
      entity: 'payment_collection',
      fields: ['payments.*'],
      filters: {
        id: splitPayment.payment_collection_id
      }
    })

    await refundPaymentWorkflow.run({
      container,
      input: {
        payment_id: payment_collection.payments[0].id,
        amount
      }
    })
  }
)
