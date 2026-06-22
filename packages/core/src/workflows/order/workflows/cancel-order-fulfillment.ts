import {
  AdditionalData,
  BigNumberInput,
  FulfillmentDTO,
  OrderDTO,
  OrderWorkflow,
  ReservationItemDTO,
} from "@medusajs/framework/types"
import {
  arrayDifference,
  MathBN,
  MedusaError,
  OrderStatus,
  OrderWorkflowEvents,
  Modules,
} from "@medusajs/framework/utils"
import {
  createWorkflow,
  createHook,
  createStep,
  parallelize,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  adjustInventoryLevelsStep,
  cancelFulfillmentWorkflow,
  cancelOrderFulfillmentStep,
  createReservationsStep,
  emitEventStep,
  updateReservationsStep,
  useQueryGraphStep,
  useRemoteQueryStep,
} from "@medusajs/medusa/core-flows"

type OfferInventoryLink = {
  inventory_item_id: string
  required_quantity: number
  inventory?: { id: string } | null
}

type OfferInventoryItemLinkRow = {
  required_quantity?: number | null
  inventory_item_id?: string | null
  inventory_item?: { id: string } | null
}

type LineItemOfferRow = {
  id: string
  offer?: {
    id: string
    inventory_item_link?: OfferInventoryItemLinkRow[] | null
  } | null
}

// Plain-object map keyed by line_item_id → inventory_item_id → link.
// Map values do not survive the workflow runtime's JSON serialization
// between transform steps.
function buildOfferInventoryByLineItem(
  rows: LineItemOfferRow[],
): Record<string, Record<string, OfferInventoryLink>> {
  const byLine: Record<string, Record<string, OfferInventoryLink>> = {}
  for (const row of rows) {
    const inner: Record<string, OfferInventoryLink> = {}
    for (const link of row.offer?.inventory_item_link ?? []) {
      const inventoryItemId =
        link.inventory_item?.id ?? link.inventory_item_id
      if (!inventoryItemId) continue
      inner[inventoryItemId] = {
        inventory_item_id: inventoryItemId,
        required_quantity: link.required_quantity ?? 1,
        inventory: link.inventory_item
          ? { id: link.inventory_item.id }
          : null,
      }
    }
    byLine[row.id] = inner
  }
  return byLine
}

export const cancelOrderFulfillmentValidateOrderStepId =
  "mercur-cancel-order-fulfillment-validate-order"

export const cancelOrderFulfillmentValidateOrderStep = createStep(
  cancelOrderFulfillmentValidateOrderStepId,
  ({
    order,
    input,
  }: {
    order: OrderDTO & { fulfillments: FulfillmentDTO[] }
    input: OrderWorkflow.CancelOrderFulfillmentWorkflowInput
  }) => {
    if (order.status === OrderStatus.CANCELED) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order with id ${order.id} has been canceled.`,
      )
    }

    const fulfillment = order.fulfillments.find(
      (f) => f.id === input.fulfillment_id,
    )
    if (!fulfillment) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Fulfillment with id ${input.fulfillment_id} not found in the order`,
      )
    }
    if (fulfillment.canceled_at) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The fulfillment is already canceled",
      )
    }
    if (fulfillment.shipped_at) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The fulfillment has already been shipped. Shipped fulfillments cannot be canceled",
      )
    }

    const orderItemIds = order.items?.map((i) => i.id) ?? []
    const fulfillmentItemIds = fulfillment.items.map(
      (i) => i.line_item_id as string,
    )
    const missing = arrayDifference(fulfillmentItemIds, orderItemIds)
    if (missing.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Items with ids ${missing.join(", ")} does not exist in order with id ${order.id}.`,
      )
    }
  },
)

function prepareCancelOrderFulfillmentData({
  order,
  fulfillment,
  offerInventoryByLineItem,
}: {
  order: OrderDTO
  fulfillment: FulfillmentDTO
  offerInventoryByLineItem: Record<string, Record<string, OfferInventoryLink>>
}) {
  const lineItemIds = Array.from(
    new Set(fulfillment.items.map((i) => i.line_item_id as string)),
  )

  return {
    order_id: order.id,
    reference: Modules.FULFILLMENT,
    reference_id: fulfillment.id,
    items: lineItemIds.map((lineItemId) => {
      const fitem = fulfillment.items.find(
        (i) => i.line_item_id === lineItemId,
      )!
      const offerByInventoryItem = offerInventoryByLineItem[lineItemId]
      const link = offerByInventoryItem?.[fitem.inventory_item_id as string]

      let quantity: BigNumberInput = fitem.quantity
      if (link?.required_quantity && link.required_quantity > 1) {
        quantity = MathBN.div(quantity, link.required_quantity) as BigNumberInput
      }

      return {
        id: lineItemId,
        quantity,
      }
    }),
  }
}

function prepareInventoryUpdate({
  fulfillment,
  reservations,
  offerInventoryByLineItem,
}: {
  fulfillment: FulfillmentDTO
  reservations: ReservationItemDTO[]
  offerInventoryByLineItem: Record<string, Record<string, OfferInventoryLink>>
}) {
  const inventoryAdjustment: {
    inventory_item_id: string
    location_id: string
    adjustment: BigNumberInput
  }[] = []
  const toCreate: {
    inventory_item_id: string
    location_id: string
    quantity: BigNumberInput
    line_item_id: string
    allow_backorder: boolean
  }[] = []
  const toUpdate: {
    id: string
    quantity: BigNumberInput
  }[] = []

  for (const fitem of fulfillment.items) {
    if (!fitem.inventory_item_id) {
      continue
    }

    const offerByInventoryItem =
      offerInventoryByLineItem[fitem.line_item_id as string]
    const link = offerByInventoryItem?.[fitem.inventory_item_id as string]
    if (!link) {
      continue
    }

    const reservation = reservations.find(
      (r) =>
        r.inventory_item_id === fitem.inventory_item_id &&
        r.line_item_id === fitem.line_item_id,
    )

    if (!reservation) {
      toCreate.push({
        inventory_item_id: link.inventory_item_id,
        location_id: fulfillment.location_id,
        quantity: fitem.quantity,
        line_item_id: fitem.line_item_id as string,
        allow_backorder: false,
      })
    } else {
      toUpdate.push({
        id: reservation.id,
        quantity: MathBN.add(
          reservation.quantity,
          fitem.quantity,
        ) as BigNumberInput,
      })
    }

    inventoryAdjustment.push({
      inventory_item_id: fitem.inventory_item_id as string,
      location_id: fulfillment.location_id,
      adjustment: fitem.quantity,
    })
  }

  return { toCreate, toUpdate, inventoryAdjustment }
}

export type CancelOrderFulfillmentWorkflowInput =
  OrderWorkflow.CancelOrderFulfillmentWorkflowInput & AdditionalData

export const cancelOrderFulfillmentWorkflowId = "mercur-cancel-order-fulfillment"

export const cancelOrderFulfillmentWorkflow = createWorkflow(
  cancelOrderFulfillmentWorkflowId,
  (input: WorkflowData<CancelOrderFulfillmentWorkflowInput>) => {
    const { data: order } = useQueryGraphStep({
      entity: "order",
      filters: { id: input.order_id },
      fields: [
        "id",
        "status",
        "items.id",
        "items.quantity",
        "fulfillments.id",
        "fulfillments.canceled_at",
        "fulfillments.shipped_at",
        "fulfillments.location_id",
        "fulfillments.items.id",
        "fulfillments.items.quantity",
        "fulfillments.items.line_item_id",
        "fulfillments.items.inventory_item_id",
      ],
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-order" })

    cancelOrderFulfillmentValidateOrderStep({ order, input })

    const fulfillment = transform({ input, order }, ({ input, order }) => {
      return order.fulfillments.find((f) => f.id === input.fulfillment_id)!
    })

    const lineItemIds = transform({ fulfillment }, ({ fulfillment }) => {
      return Array.from(
        new Set(fulfillment.items.map((i) => i.line_item_id as string)),
      )
    })

    const reservations = useRemoteQueryStep({
      entry_point: "reservations",
      fields: [
        "id",
        "line_item_id",
        "quantity",
        "inventory_item_id",
        "location_id",
      ],
      variables: { filters: { line_item_id: lineItemIds } },
    }).config({ name: "get-reservations" })

    const { data: lineItemOffers } = useQueryGraphStep({
      entity: "order_line_item",
      fields: [
        "id",
        "offer.id",
        "offer.inventory_item_link.required_quantity",
        "offer.inventory_item_link.inventory_item.id",
      ],
      filters: { id: lineItemIds },
    }).config({ name: "get-line-item-offers" })

    const offerInventoryByLineItem = transform(
      { lineItemOffers },
      ({ lineItemOffers }) =>
        buildOfferInventoryByLineItem(lineItemOffers as LineItemOfferRow[]),
    )

    const cancelOrderFulfillmentData = transform(
      { order, fulfillment, offerInventoryByLineItem },
      prepareCancelOrderFulfillmentData,
    )

    const { toCreate, toUpdate, inventoryAdjustment } = transform(
      { fulfillment, reservations, offerInventoryByLineItem },
      prepareInventoryUpdate,
    )

    adjustInventoryLevelsStep(inventoryAdjustment)

    const eventData = transform({ order, fulfillment, input }, (data) => {
      return {
        order_id: data.order.id,
        fulfillment_id: data.fulfillment.id,
        no_notification: data.input.no_notification,
      }
    })

    parallelize(
      cancelOrderFulfillmentStep(cancelOrderFulfillmentData),
      createReservationsStep(toCreate),
      updateReservationsStep(toUpdate),
      emitEventStep({
        eventName: OrderWorkflowEvents.FULFILLMENT_CANCELED,
        data: eventData,
      }),
    )

    cancelFulfillmentWorkflow.runAsStep({
      input: { id: input.fulfillment_id },
    })

    const orderFulfillmentCanceled = createHook("orderFulfillmentCanceled", {
      fulfillment,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [orderFulfillmentCanceled],
    })
  },
)
