import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  completeOrderWorkflow,
  createOrderShipmentWorkflow,
  getOrderDetailWorkflow
} from '@medusajs/medusa/core-flows'

createOrderShipmentWorkflow.hooks.shipmentCreated(
  async ({ shipment }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [fulfillment]
    } = await query.graph({
      entity: 'fulfillment',
      fields: ['order.id'],
      filters: {
        id: shipment.id
      }
    })

    const order_id = fulfillment.order.id

    const { result: order } = await getOrderDetailWorkflow.run({
      container,
      input: {
        order_id,
        fields: ['payment_status']
      }
    })

    if (order.payment_status === 'captured') {
      await completeOrderWorkflow.run({
        container,
        input: {
          orderIds: [order_id]
        }
      })
    }
  }
)
