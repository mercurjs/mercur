import {
  BigNumberInput,
  OrderChangeActionDTO,
  OrderChangeDTO,
  OrderDTO,
  OrderPreviewDTO,
  OrderReturnItemDTO,
  ReturnDTO,
} from "@medusajs/framework/types"
import {
  ChangeActionType,
  MathBN,
  Modules,
  OrderChangeStatus,
  OrderWorkflowEvents,
  ReturnStatus,
} from "@medusajs/framework/utils"
import {
  createWorkflow,
  createStep,
  parallelize,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  adjustInventoryLevelsStep,
  createOrUpdateOrderPaymentCollectionWorkflow,
  emitEventStep,
  previewOrderChangeStep,
  updateReturnItemsStep,
  updateReturnsStep,
  useRemoteQueryStep,
} from "@medusajs/medusa/core-flows"

type ConfirmOrderChangesInput = {
  orderId: string
  changes: OrderChangeDTO[]
  confirmed_by?: string
}

const confirmOrderChangesStep = createStep(
  "mercur-confirm-order-changes",
  async (input: ConfirmOrderChangesInput, { container }) => {
    const orderModuleService = container.resolve(Modules.ORDER)
    const currentChanges: Partial<OrderChangeDTO>[] = []
    const orderChanges = await orderModuleService.confirmOrderChange(
      input.changes.map((action) => {
        const update = { id: action.id, confirmed_by: input.confirmed_by }
        currentChanges.push({
          ...update,
          order_id: input.orderId,
          status: action.status,
        })
        return update
      }),
    )
    return new StepResponse(orderChanges, currentChanges)
  },
  async (currentChanges, { container }) => {
    if (!currentChanges?.length) return
    const orderModuleService = container.resolve(Modules.ORDER)
    await orderModuleService.undoLastChange(
      currentChanges[0].order_id!,
      currentChanges[0],
    )
  },
)

type OfferLocationLevel = {
  location_id: string
}

type OfferInventoryItemLinkRow = {
  required_quantity?: number | null
  inventory_item_id?: string | null
  inventory_item?: {
    id: string
    location_levels?: OfferLocationLevel[] | null
  } | null
}

type ReturnItemWithOffer = OrderReturnItemDTO & {
  item?: {
    id?: string
    variant_id?: string
    offer?: {
      id: string
      inventory_item_link?: OfferInventoryItemLinkRow[] | null
    } | null
  } | null
}

type ReturnWithOfferItems = ReturnDTO & {
  items?: ReturnItemWithOffer[]
}

function prepareInventoryUpdate({
  orderReturn,
  returnedQuantityByOffer,
}: {
  orderReturn: ReturnWithOfferItems
  returnedQuantityByOffer: Record<string, BigNumberInput>
}) {
  const inventoryAdjustment: {
    inventory_item_id: string
    location_id: string
    adjustment: BigNumberInput
  }[] = []

  type NormalizedLink = {
    inventory_item_id: string
    required_quantity: number
    location_levels: OfferLocationLevel[]
  }
  const offerInventoryById = new Map<string, NormalizedLink[]>()
  let hasManagedInventory = false
  let hasStockLocation = false

  for (const retItem of orderReturn.items ?? []) {
    const offer = retItem.item?.offer
    if (!offer?.id) continue
    if (offerInventoryById.has(offer.id)) continue

    const rows = offer.inventory_item_link ?? []
    if (!rows.length) continue
    hasManagedInventory = true

    const normalized: NormalizedLink[] = []
    for (const link of rows) {
      const inventoryItemId =
        link.inventory_item?.id ?? link.inventory_item_id
      if (!inventoryItemId) continue
      normalized.push({
        inventory_item_id: inventoryItemId,
        required_quantity: link.required_quantity ?? 1,
        location_levels: link.inventory_item?.location_levels ?? [],
      })
    }

    if (
      normalized.some((link) =>
        link.location_levels.some(
          (lvl) => lvl.location_id === orderReturn.location_id,
        ),
      )
    ) {
      hasStockLocation = true
    }

    offerInventoryById.set(offer.id, normalized)
  }

  if (hasManagedInventory && !hasStockLocation) {
    throw new Error(
      `Cannot receive the Return at location ${orderReturn.location_id}`,
    )
  }

  const locationId = orderReturn.location_id as string

  for (const [offerId, quantity] of Object.entries(returnedQuantityByOffer)) {
    const links = offerInventoryById.get(offerId) ?? []
    for (const link of links) {
      inventoryAdjustment.push({
        inventory_item_id: link.inventory_item_id,
        location_id: locationId,
        adjustment: MathBN.mult(
          quantity as BigNumberInput,
          link.required_quantity,
        ),
      })
    }
  }

  return inventoryAdjustment
}

export type ConfirmReceiveReturnRequestWorkflowInput = {
  return_id: string
  confirmed_by?: string
}

export const confirmReturnReceiveWorkflowId = "mercur-confirm-return-receive"

// Same-id replacement for Medusa's confirmReturnReceiveWorkflow. Mercur
// resolves restock quantities by the order line's linked offer (not by
// variant), since marketplace inventory ownership lives on the offer.
export const confirmReturnReceiveWorkflow = createWorkflow(
  confirmReturnReceiveWorkflowId,
  function (
    input: ConfirmReceiveReturnRequestWorkflowInput,
  ): WorkflowResponse<OrderPreviewDTO> {
    const orderReturn = useRemoteQueryStep({
      entry_point: "return",
      fields: [
        "id",
        "status",
        "order_id",
        "location_id",
        "canceled_at",
        "items.*",
        "items.item.id",
        "items.item.variant_id",
        "items.item.offer.id",
        "items.item.offer.inventory_item_link.required_quantity",
        "items.item.offer.inventory_item_link.inventory_item.id",
        "items.item.offer.inventory_item_link.inventory_item.location_levels.location_id",
      ],
      variables: { id: input.return_id },
      list: false,
      throw_if_key_not_found: true,
    }) as unknown as ReturnWithOfferItems

    const order: OrderDTO = useRemoteQueryStep({
      entry_point: "orders",
      fields: ["id", "version", "canceled_at"],
      variables: { id: orderReturn.order_id },
      list: false,
      throw_if_key_not_found: true,
    }).config({ name: "order-query" })

    const orderChange: OrderChangeDTO = useRemoteQueryStep({
      entry_point: "order_change",
      fields: [
        "id",
        "status",
        "actions.id",
        "actions.action",
        "actions.details",
        "actions.reference",
        "actions.reference_id",
        "actions.internal_note",
      ],
      variables: {
        filters: {
          order_id: orderReturn.order_id,
          return_id: orderReturn.id,
          status: [OrderChangeStatus.PENDING, OrderChangeStatus.REQUESTED],
        },
      },
      list: false,
    }).config({ name: "order-change-query" })

    const { updateReturnItem, returnedQuantityByOffer, updateReturn } =
      transform({ orderChange, orderReturn }, (data) => {
        const returnedQuantityByOffer: Record<string, BigNumberInput> = {}

        const retItems: ReturnItemWithOffer[] = data.orderReturn.items ?? []
        const received: OrderChangeActionDTO[] = []

        const offerByLineItemId = new Map<string, string>()
        for (const ri of retItems) {
          const lineItemId = ri.item?.id
          const offerId = ri.item?.offer?.id
          if (lineItemId && offerId) {
            offerByLineItemId.set(lineItemId, offerId)
          }
        }

        data.orderChange.actions.forEach((act) => {
          if (
            [
              ChangeActionType.RECEIVE_RETURN_ITEM,
              ChangeActionType.RECEIVE_DAMAGED_RETURN_ITEM,
            ].includes(act.action as ChangeActionType)
          ) {
            received.push(act)

            if (act.action === ChangeActionType.RECEIVE_RETURN_ITEM) {
              const lineItemId = act.details!.reference_id as string
              const offerId = offerByLineItemId.get(lineItemId)
              if (!offerId) {
                return
              }
              const current = returnedQuantityByOffer[offerId] ?? 0
              returnedQuantityByOffer[offerId] = MathBN.add(
                current,
                act.details!.quantity as number,
              ) as BigNumberInput
            }
          }
        })

        const itemMap = retItems.reduce(
          (acc, item) => {
            const key = (item as unknown as { item_id: string }).item_id
            acc[key] = item.id
            return acc
          },
          {} as Record<string, string>,
        )

        const itemUpdates: Record<
          string,
          {
            id: string
            received_quantity: BigNumberInput
            damaged_quantity: BigNumberInput
          }
        > = {}
        received.forEach((act) => {
          const itemId = act.details!.reference_id as string
          if (itemUpdates[itemId]) {
            itemUpdates[itemId].received_quantity = MathBN.add(
              itemUpdates[itemId].received_quantity,
              act.details!.quantity as BigNumberInput,
            ) as BigNumberInput

            if (act.action === ChangeActionType.RECEIVE_DAMAGED_RETURN_ITEM) {
              itemUpdates[itemId].damaged_quantity = MathBN.add(
                itemUpdates[itemId].damaged_quantity,
                act.details!.quantity as BigNumberInput,
              ) as BigNumberInput
            }
            return
          }

          itemUpdates[itemId] = {
            id: itemMap[itemId],
            received_quantity: act.details!.quantity as BigNumberInput,
            damaged_quantity:
              act.action === ChangeActionType.RECEIVE_DAMAGED_RETURN_ITEM
                ? (act.details!.quantity as BigNumberInput)
                : (0 as BigNumberInput),
          }
        })

        const hasReceivedAllItems = retItems.every((item) => {
          const itemId = (item as unknown as { item_id: string }).item_id
          const received: BigNumberInput = itemUpdates[itemId]
            ? itemUpdates[itemId].received_quantity
            : (item.received_quantity ?? (0 as BigNumberInput))
          return MathBN.eq(received, item.quantity)
        })
        const updateReturnData = hasReceivedAllItems
          ? { status: ReturnStatus.RECEIVED, received_at: new Date() }
          : { status: ReturnStatus.PARTIALLY_RECEIVED }

        const updateReturn = {
          id: data.orderReturn.id,
          ...updateReturnData,
        }

        return {
          updateReturnItem: Object.values(itemUpdates),
          returnedQuantityByOffer,
          updateReturn,
        }
      })

    const inventoryAdjustment = transform(
      { orderReturn, returnedQuantityByOffer },
      prepareInventoryUpdate,
    )

    // Mercur skips Medusa's confirmReceiveReturnValidationStep — the
    // validations it owns (cancel guards, order-change-active guards) are
    // covered by the upstream callers; the inline `prepareInventoryUpdate`
    // throws when the return's location has no stock for any offer-linked
    // inventory item.

    parallelize(
      updateReturnsStep([updateReturn]),
      updateReturnItemsStep(updateReturnItem as never),
      confirmOrderChangesStep({
        changes: [orderChange],
        orderId: order.id,
        confirmed_by: input.confirmed_by,
      }),
      adjustInventoryLevelsStep(inventoryAdjustment),
    )

    parallelize(
      createOrUpdateOrderPaymentCollectionWorkflow.runAsStep({
        input: { order_id: order.id },
      }),
      emitEventStep({
        eventName: OrderWorkflowEvents.RETURN_RECEIVED,
        data: {
          order_id: order.id,
          return_id: orderReturn.id,
        },
      }),
    )

    return new WorkflowResponse(previewOrderChangeStep(order.id))
  },
)
