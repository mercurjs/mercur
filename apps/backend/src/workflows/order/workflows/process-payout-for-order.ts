import { PAYOUT_MODULE } from '#/modules/payout'
import { PayoutWorkflowEvents } from '#/modules/payout/types'

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
  validateSellerPayoutAccountStep
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

    const { data: sellers } = useQueryGraphStep({
      entity: 'seller',
      fields: ['*', 'payout_account.*'],
      filters: {
        id: order.seller_id
      }
    }).config({ name: 'query-seller' })

    const seller = transform(sellers, (sellers) => sellers[0])

    validateSellerPayoutAccountStep(seller)

    const { payout, err: createPayoutErr } = createPayoutStep({
      transaction_id: order.id,
      amount: order.total,
      currency_code: order.currency_code,
      account_id: seller.payout_account.id
    })

    when({ createPayoutErr }, ({ createPayoutErr }) => !createPayoutErr).then(
      () => {
        createRemoteLinkStep([
          {
            [Modules.ORDER]: {
              order_id: order.id
            },
            [PAYOUT_MODULE]: {
              payout_id: payout!.id
            }
          }
        ])

        emitEventStep({
          eventName: PayoutWorkflowEvents.SUCCEEDED,
          data: {
            id: payout!.id,
            order_id: order.id
          }
        }).config({ name: 'emit-payout-succeeded' })
      }
    )

    when({ createPayoutErr }, ({ createPayoutErr }) => createPayoutErr).then(
      () => {
        emitEventStep({
          eventName: PayoutWorkflowEvents.FAILED,
          data: {
            order_id: order.id
          }
        }).config({ name: 'emit-payout-failed' })
      }
    )
  }
)
