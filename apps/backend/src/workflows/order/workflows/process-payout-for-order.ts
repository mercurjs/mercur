import sellerOrderLink from '#/links/seller-order'
import { PayoutEvents } from '#/modules/payout/types'
import { SELLER_MODULE } from '#/modules/seller'

import { Modules } from '@medusajs/framework/utils'
import { transform, when } from '@medusajs/framework/workflows-sdk'
import {
  createRemoteLinkStep,
  emitEventStep,
  useQueryGraphStep
} from '@medusajs/medusa/core-flows'
import { createWorkflow } from '@medusajs/workflows-sdk'

import {
  createPayoutStep,
  validateNoExistingPayoutForOrderStep,
  validatePayoutAccountStep
} from '../steps'

type ProcessPayoutForOrderWorkflowInput = {
  order_id: string
}

export const processPayoutForOrderWorkflow = createWorkflow(
  { name: 'process-payout-for-order', idempotent: true },
  function (input: ProcessPayoutForOrderWorkflowInput) {
    validateNoExistingPayoutForOrderStep(input.order_id)

    const { data: orders } = useQueryGraphStep({
      entity: 'order',
      fields: ['id', 'total', 'currency_code'],
      filters: {
        id: input.order_id
      },
      options: { throwIfKeyNotFound: true }
    }).config({ name: 'query-order' })

    const order = transform(orders, (orders) => orders[0])

    const { data: sellerRelations } = useQueryGraphStep({
      entity: sellerOrderLink.entryPoint,
      fields: ['seller.*', 'seller.payout_account.*'],
      filters: {
        id: order.seller_id
      }
    }).config({ name: 'query-seller' })

    const seller = transform(sellerRelations, (sellers) => sellers[0])

    validatePayoutAccountStep(seller.payout_account)

    const { payout, err } = createPayoutStep({
      transaction_id: order.id,
      amount: order.total,
      currency_code: order.currency_code,
      account_id: seller.payout_account.id
    })

    when({ payout }, ({ payout }) => !!payout).then(() => {
      createRemoteLinkStep([
        {
          [Modules.ORDER]: {
            order_id: order.id
          },
          [SELLER_MODULE]: {
            seller_id: seller.id
          }
        }
      ])

      emitEventStep({
        eventName: PayoutEvents.SUCCEEDED,
        data: {
          id: payout!.id,
          order_id: order.id
        }
      })
    })

    when({ err }, ({ err }) => !!err).then(() => {
      emitEventStep({
        eventName: PayoutEvents.FAILED,
        data: {
          order_id: order.id
        }
      })
    })
  }
)
