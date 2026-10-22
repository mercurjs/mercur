import { ContainerRegistrationKeys, OrderStatus } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { cancelOrderWorkflow } from "@medusajs/medusa/core-flows"

export type CancelOrderGroupOrdersStepInput = {
  order_ids: string[]
  canceled_by?: string
}

export const cancelOrderGroupOrdersStepId = "cancel-order-group-orders"
export const cancelOrderGroupOrdersStep = createStep(
  cancelOrderGroupOrdersStepId,
  async (input: CancelOrderGroupOrdersStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "status", "canceled_at"],
      filters: { id: input.order_ids },
    })

    const canceled: string[] = []
    for (const order of orders) {
      if (order.status === OrderStatus.CANCELED || order.canceled_at) {
        continue
      }
      await cancelOrderWorkflow(container).run({
        input: { order_id: order.id, canceled_by: input.canceled_by },
      })
      canceled.push(order.id)
    }

    return new StepResponse(canceled)
  }
)
