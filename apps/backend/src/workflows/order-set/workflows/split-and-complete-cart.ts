import {
  Modules,
  OrderStatus,
  OrderWorkflowEvents
} from '@medusajs/framework/utils'
import { parallelize, transform, when } from '@medusajs/framework/workflows-sdk'
import {
  authorizePaymentSessionStep,
  createOrdersStep,
  createRemoteLinkStep,
  emitEventStep,
  reserveInventoryStep,
  updateCartsStep,
  useRemoteQueryStep,
  validateCartPaymentsStep
} from '@medusajs/medusa/core-flows'
import { CartShippingMethodDTO } from '@medusajs/types/dist/cart'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import orderSetCartLink from '../../../links/order-set-cart'
import { MARKETPLACE_MODULE } from '../../../modules/marketplace'
import { OrderSetWorkflowEvents } from '../../../modules/marketplace/types'
import { SELLER_MODULE } from '../../../modules/seller'
import { createOrderSetStep } from '../steps'
import {
  completeCartFields,
  prepareConfirmInventoryInput,
  prepareLineItemData,
  prepareTaxLinesData
} from '../utils'

type SplitAndCompleteCartWorkflowInput = {
  id: string
}

export const splitAndCompleteCartWorkflow = createWorkflow(
  {
    name: 'split-and-complete-cart',
    idempotent: true
  },
  function (
    input: SplitAndCompleteCartWorkflowInput
  ): WorkflowResponse<{ id: string }> {
    // TODO: validate shipping methods

    const existingOrderSet = useRemoteQueryStep({
      entry_point: orderSetCartLink.entryPoint,
      fields: ['order_id'],
      variables: {
        cart_id: input.id
      },
      list: false
    }).config({ name: 'order-set-query' })

    const orderSet = when({ existingOrderSet }, (orderSet) => !!orderSet).then(
      () => {
        const cart = useRemoteQueryStep({
          entry_point: 'cart',
          fields: completeCartFields,
          variables: {
            id: input.id
          },
          list: false
        }).config({ name: 'cart-query' })

        const paymentSessions = validateCartPaymentsStep({ cart })

        const payment = authorizePaymentSessionStep({
          id: paymentSessions[0].id,
          context: { cart_id: cart.id }
        })

        const { ordersToCreate, sellers, variants } = transform(
          { cart },
          ({ cart }) => {
            const sellerLineItemsMap = new Map<string, any[]>()
            const sellerShippingMethodsMap = new Map<
              string,
              CartShippingMethodDTO
            >()
            const variantsMap = new Map<string, any>()
            const sellerTotalsMap = new Map<string, number>()

            cart.items.forEach((item) => {
              const sellerId = item.variant.product.seller.id
              const lineItems = sellerLineItemsMap.get(sellerId) || []
              lineItems.push(item)
              sellerLineItemsMap.set(sellerId, lineItems)

              const total = sellerTotalsMap.get(sellerId) || 0
              sellerTotalsMap.set(sellerId, total + item.total)

              variantsMap.set(item.variant.id, item.variant)
            })

            cart.shipping_methods.forEach((method) => {
              const sellerId = method.shipping_option.vendor.id
              sellerShippingMethodsMap.set(sellerId, method)

              const total = sellerTotalsMap.get(sellerId) || 0
              sellerTotalsMap.set(sellerId, total + method.total)
            })

            const sellers = Array.from(sellerLineItemsMap.keys())

            const ordersToCreate = sellers.map((sellerId) => {
              const sm = sellerShippingMethodsMap.get(sellerId)!

              const items = sellerLineItemsMap.get(sellerId)!.map((item) =>
                prepareLineItemData({
                  item,
                  variant: item.variant,
                  unitPrice: item.unit_price,
                  compareAtUnitPrice: item.compare_at_unit_price,
                  isTaxInclusive: item.is_tax_inclusive,
                  quantity: item.quantity,
                  metadata: item?.metadata,
                  taxLines: item.tax_lines ?? []
                })
              )

              return {
                region_id: cart.region?.id,
                customer_id: cart.customer?.id,
                sales_channel_id: cart.sales_channel_id,
                status: OrderStatus.PENDING,
                email: cart.email,
                currency_code: cart.currency_code,
                shipping_address: cart.shipping_address,
                billing_address: cart.billing_address,
                no_notification: false,
                items,
                shipping_methods: [
                  {
                    name: sm.name,
                    description: sm.description,
                    amount: sm.amount,
                    is_tax_inclusive: sm.is_tax_inclusive,
                    shipping_option_id: sm.shipping_option_id,
                    data: sm.data,
                    metadata: sm.metadata,
                    tax_lines: prepareTaxLinesData(sm.tax_lines ?? [])
                  }
                ],
                transactions:
                  payment.captures?.map((capture) => ({
                    amount: sellerTotalsMap.get(sellerId)!,
                    currency_code: cart.currency_code,
                    reference: 'capture',
                    reference_id: capture.id
                  })) ?? []
              }
            })

            return {
              ordersToCreate,
              sellers,
              variants: Array.from(variantsMap.values())
            }
          }
        )

        const orderSet = createOrderSetStep()
        const createdOrders = createOrdersStep(ordersToCreate)

        const reservationItemsData = transform(
          { createdOrders },
          ({ createdOrders }) =>
            createdOrders.reduce<
              {
                variant_id: string
                quantity: number
                id: string
              }[]
            >((acc, order) => {
              acc.push(
                ...order.items!.map((i) => ({
                  variant_id: i.variant_id!,
                  quantity: i.quantity,
                  id: i.id
                }))
              )
              return acc
            }, [])
        )

        const updateCartInput = transform({ cart }, ({ cart }) => ({
          id: cart.id,
          completed_at: new Date()
        }))

        const formatedInventoryItems = transform(
          {
            input: {
              sales_channel_id: cart.sales_channel_id,
              variants,
              items: reservationItemsData
            }
          },
          prepareConfirmInventoryInput
        )

        const links = transform(
          {
            createdOrders,
            sellers,
            orderSet,
            cart
          },
          ({ createdOrders, sellers, orderSet }) => {
            const sellerOrderLinks = createdOrders.map((order, index) => ({
              [SELLER_MODULE]: {
                seller_id: sellers[index]
              },
              [Modules.ORDER]: {
                order_id: order.id
              }
            }))

            const orderSetOrderLinks = createdOrders.map((order) => ({
              [MARKETPLACE_MODULE]: {
                order_set_id: orderSet.id
              },
              [Modules.ORDER]: {
                order_id: order.id
              }
            }))

            const orderSetCartLink = {
              [MARKETPLACE_MODULE]: {
                order_set_id: orderSet.id
              },
              [Modules.CART]: {
                cart_id: cart.id
              }
            }

            const orderSetCustomerLink = {
              [MARKETPLACE_MODULE]: {
                order_set_id: orderSet.id
              },
              [Modules.CUSTOMER]: {
                customer_id: cart.customer_id
              }
            }

            return [
              ...sellerOrderLinks,
              ...orderSetOrderLinks,
              orderSetCartLink,
              orderSetCustomerLink
            ]
          }
        )

        const orderEvents = transform(
          { createdOrders },
          ({ createdOrders }) => ({
            eventName: OrderWorkflowEvents.PLACED,
            data: createdOrders.map((order) => ({
              id: order.id
            }))
          })
        )

        parallelize(
          createRemoteLinkStep(links),
          reserveInventoryStep(formatedInventoryItems),
          updateCartsStep([updateCartInput]),
          emitEventStep(orderEvents),
          emitEventStep({
            eventName: OrderSetWorkflowEvents.PLACED,
            data: {
              id: orderSet.id
            }
          }).config({ name: 'order-set-event' })
        )

        return orderSet
      }
    )

    const orderSetId = transform(
      { orderSet, existingOrderSet },
      ({ orderSet, existingOrderSet }) =>
        orderSet ? orderSet.id : existingOrderSet
    )

    return new WorkflowResponse({ id: orderSetId })
  }
)
