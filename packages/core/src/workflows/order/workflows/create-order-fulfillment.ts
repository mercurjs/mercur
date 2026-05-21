import {
  AdditionalData,
  BigNumberInput,
  FulfillmentWorkflow,
  OrderDTO,
  OrderLineItemDTO,
  OrderWorkflow,
  ReservationItemDTO,
} from "@medusajs/framework/types"
import {
  arrayDifference,
  MathBN,
  MedusaError,
  Modules,
  OrderStatus,
  OrderWorkflowEvents,
} from "@medusajs/framework/utils"
import {
  createHook,
  createStep,
  parallelize,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  adjustInventoryLevelsStep,
  createFulfillmentWorkflow,
  createRemoteLinkStep,
  deleteReservationsStep,
  emitEventStep,
  registerOrderFulfillmentStep,
  updateReservationsStep,
  useQueryGraphStep,
  useRemoteQueryStep,
} from "@medusajs/medusa/core-flows"
import { overrideWorkflow } from "../../utils/override-workflow"

type OfferInventoryLink = {
  inventory_item_id: string
  required_quantity: number
  inventory?: {
    id: string
    title?: string | null
    sku?: string | null
  } | null
}

type OfferInventoryItemLinkRow = {
  required_quantity?: number | null
  inventory_item_id?: string | null
  inventory_item?: {
    id: string
    title?: string | null
    sku?: string | null
  } | null
}

type LineItemOfferRow = {
  id: string
  offer?: {
    id: string
    inventory_item_link?: OfferInventoryItemLinkRow[] | null
  } | null
}

function buildReservationsMap(reservations: ReservationItemDTO[]) {
  const map = new Map<string, ReservationItemDTO[]>()
  for (const reservation of reservations) {
    const key = reservation.line_item_id as string
    const list = map.get(key)
    if (list) {
      list.push(reservation)
    } else {
      map.set(key, [reservation])
    }
  }
  return map
}

// Returns a plain-object map keyed by line_item_id → inventory_item_id →
// link. Returning Map objects from a workflow `transform()` does not
// survive the workflow runtime's JSON serialization between steps —
// downstream resolvers would receive `{}` and crash on `.get(...)`.
function buildOfferInventoryByLineItem(
  lineItemOffers: LineItemOfferRow[],
): Record<string, Record<string, OfferInventoryLink>> {
  const byLine: Record<string, Record<string, OfferInventoryLink>> = {}
  for (const row of lineItemOffers) {
    const links = row.offer?.inventory_item_link ?? []
    const byInventoryItem: Record<string, OfferInventoryLink> = {}
    for (const link of links) {
      const inventoryItemId =
        link.inventory_item?.id ?? link.inventory_item_id
      if (!inventoryItemId) continue
      byInventoryItem[inventoryItemId] = {
        inventory_item_id: inventoryItemId,
        required_quantity: link.required_quantity ?? 1,
        inventory: link.inventory_item
          ? {
              id: link.inventory_item.id,
              title: link.inventory_item.title ?? null,
              sku: link.inventory_item.sku ?? null,
            }
          : null,
      }
    }
    byLine[row.id] = byInventoryItem
  }
  return byLine
}

export const createOrderFulfillmentValidateOrderStepId =
  "mercur-create-order-fulfillment-validate-order"

export const createOrderFulfillmentValidateOrderStep = createStep(
  createOrderFulfillmentValidateOrderStepId,
  ({
    order,
    inputItems,
  }: {
    order: OrderDTO
    inputItems: OrderWorkflow.CreateOrderFulfillmentWorkflowInput["items"]
  }) => {
    if (!inputItems.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No items to fulfill",
      )
    }

    if (order.status === OrderStatus.CANCELED) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order with id ${order.id} has been canceled.`,
      )
    }

    const orderItemIds = order.items?.map((i) => i.id) ?? []
    const inputItemIds = inputItems.map((i) => i.id)
    const missing = arrayDifference(inputItemIds, orderItemIds)
    if (missing.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Items with ids ${missing.join(", ")} does not exist in order with id ${order.id}.`,
      )
    }

    const orderItemsById = new Map<string, OrderLineItemDTO>(
      (order.items ?? []).map((item) => [item.id, item]),
    )
    const withShipping: string[] = []
    const withoutShipping: string[] = []
    for (const inputItem of inputItems) {
      const orderItem = orderItemsById.get(inputItem.id)
      if (!orderItem) continue
      if (orderItem.requires_shipping) {
        withShipping.push(orderItem.id)
      } else {
        withoutShipping.push(orderItem.id)
      }
    }
    if (withShipping.length && withoutShipping.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Fulfillment can only be created entirely with items with shipping or items without shipping. Split this request into 2 fulfillments.",
      )
    }
  },
)

function prepareRegisterOrderFulfillmentData({
  order,
  fulfillment,
  input,
  inputItemsMap,
  itemsList,
}: {
  order: OrderDTO
  fulfillment: { id: string }
  input: OrderWorkflow.CreateOrderFulfillmentWorkflowInput & AdditionalData
  inputItemsMap: Record<
    string,
    OrderWorkflow.CreateOrderFulfillmentWorkflowInput["items"][number]
  >
  itemsList?: { id: string; quantity: BigNumberInput }[]
}) {
  const items = (itemsList ?? order.items ?? []) as Array<{
    id: string
    quantity: BigNumberInput
  }>
  return {
    order_id: order.id,
    reference: Modules.FULFILLMENT,
    reference_id: fulfillment.id,
    created_by: input.created_by,
    items: items.map((i) => {
      const inputQuantity = inputItemsMap[i.id]?.quantity
      return {
        id: i.id,
        quantity: inputQuantity ?? i.quantity,
      }
    }),
  }
}

function prepareFulfillmentData({
  order,
  input,
  shippingOption,
  shippingMethod,
  reservations,
  itemsList,
  offerInventoryByLineItem,
}: {
  order: OrderDTO
  input: OrderWorkflow.CreateOrderFulfillmentWorkflowInput
  shippingOption: {
    id: string
    provider_id: string
    service_zone: { fulfillment_set: { location?: { id: string } } }
    shipping_profile_id: string
  }
  shippingMethod: { data?: Record<string, unknown> | null }
  reservations: ReservationItemDTO[]
  itemsList?: OrderLineItemDTO[]
  offerInventoryByLineItem: Record<string, Record<string, OfferInventoryLink>>
}) {
  const fulfillableItems = input.items
  const orderItemsMap = new Map<string, Required<OrderDTO>["items"][0]>(
    (itemsList ?? order.items)!.map((i) => [i.id, i]),
  )

  const reservationItemMap = buildReservationsMap(reservations)

  const someItemsRequireShipping = fulfillableItems.length
    ? fulfillableItems.some((item) => {
        const orderItem = orderItemsMap.get(item.id)!
        return orderItem.requires_shipping
      })
    : true

  const fulfillmentItems = fulfillableItems
    .map((i) => {
      const orderItem = orderItemsMap.get(i.id)!
      const reservations = reservationItemMap.get(i.id)
      const offerByInventoryItem = offerInventoryByLineItem[i.id]

      if (!reservations?.length) {
        return [
          {
            line_item_id: i.id,
            inventory_item_id: undefined,
            quantity: i.quantity,
            title: orderItem.variant_title ?? orderItem.title,
            sku: orderItem.variant_sku || "",
            barcode: orderItem.variant_barcode || "",
          },
        ] as FulfillmentWorkflow.CreateFulfillmentItemWorkflowDTO[]
      }

      return reservations.map((r) => {
        const link = offerByInventoryItem?.[r.inventory_item_id as string]
        const requiredQuantity = link?.required_quantity ?? 1
        return {
          line_item_id: i.id,
          inventory_item_id: r.inventory_item_id,
          quantity: MathBN.mult(
            requiredQuantity,
            i.quantity,
          ) as BigNumberInput,
          title:
            link?.inventory?.title ||
            orderItem.variant_title ||
            orderItem.title,
          sku: link?.inventory?.sku || orderItem.variant_sku || "",
          barcode: orderItem.variant_barcode || "",
        } as FulfillmentWorkflow.CreateFulfillmentItemWorkflowDTO
      })
    })
    .flat()

  let locationId: string | undefined | null = input.location_id
  if (!locationId) {
    locationId = shippingOption.service_zone.fulfillment_set.location?.id
  }
  if (!locationId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Cannot create fulfillment without stock location, either provide a location or you should link the shipping option ${shippingOption.id} to a stock location.`,
    )
  }

  const shippingAddress = order.shipping_address ?? { id: undefined }
  delete shippingAddress.id

  return {
    input: {
      location_id: locationId,
      provider_id: shippingOption.provider_id,
      shipping_option_id: shippingOption.id,
      order,
      data: shippingMethod.data,
      items: fulfillmentItems,
      requires_shipping: someItemsRequireShipping,
      labels: input.labels ?? [],
      delivery_address: shippingAddress as never,
      created_by: input.created_by,
      packed_at: new Date(),
      metadata: input.metadata,
    },
  }
}

function prepareInventoryUpdate({
  reservations,
  order,
  input,
  inputItemsMap,
  itemsList,
  offerInventoryByLineItem,
}: {
  reservations: ReservationItemDTO[]
  order: OrderDTO
  input: OrderWorkflow.CreateOrderFulfillmentWorkflowInput
  inputItemsMap: Record<
    string,
    OrderWorkflow.CreateOrderFulfillmentWorkflowInput["items"][number]
  >
  itemsList?: OrderLineItemDTO[]
  offerInventoryByLineItem: Record<string, Record<string, OfferInventoryLink>>
}) {
  const toDelete: string[] = []
  const toUpdate: {
    id: string
    quantity: BigNumberInput
    location_id: string
  }[] = []
  const inventoryAdjustment: {
    inventory_item_id: string
    location_id: string
    adjustment: BigNumberInput
  }[] = []

  const reservationMap = buildReservationsMap(reservations)
  const allItems = itemsList ?? order.items ?? []
  const itemsToFulfill = allItems.filter((i) => i.id in inputItemsMap)

  for (const item of itemsToFulfill) {
    const reservations = reservationMap.get(item.id)
    const offerByInventoryItem = offerInventoryByLineItem[item.id]

    if (!reservations?.length) {
      continue
    }

    const inputQuantity = inputItemsMap[item.id]?.quantity ?? item.quantity

    reservations.forEach((reservation) => {
      const link =
        offerByInventoryItem?.[reservation.inventory_item_id as string]
      const requiredQuantity = link?.required_quantity ?? 1

      const adjustmentQuantity = MathBN.mult(inputQuantity, requiredQuantity)
      const remainingReservationQuantity = MathBN.sub(
        reservation.quantity,
        adjustmentQuantity,
      )

      if (MathBN.lt(remainingReservationQuantity, 0)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Quantity to fulfill exceeds the reserved quantity for the item: ${item.id}`,
        )
      }

      inventoryAdjustment.push({
        inventory_item_id: reservation.inventory_item_id as string,
        location_id: input.location_id ?? (reservation.location_id as string),
        adjustment: MathBN.mult(adjustmentQuantity, -1),
      })

      if (MathBN.eq(remainingReservationQuantity, 0)) {
        toDelete.push(reservation.id)
      } else {
        toUpdate.push({
          id: reservation.id,
          quantity: remainingReservationQuantity as BigNumberInput,
          location_id: input.location_id ?? (reservation.location_id as string),
        })
      }
    })
  }

  return { toDelete, toUpdate, inventoryAdjustment }
}

export type CreateOrderFulfillmentWorkflowInput =
  OrderWorkflow.CreateOrderFulfillmentWorkflowInput & AdditionalData

export const createOrderFulfillmentWorkflowId = "create-order-fulfillment"

export const createOrderFulfillmentWorkflow = overrideWorkflow(
  createOrderFulfillmentWorkflowId,
  (input: WorkflowData<CreateOrderFulfillmentWorkflowInput>) => {
    const { data: order } = useQueryGraphStep({
      entity: "order",
      filters: { id: input.order_id },
      fields: [
        "id",
        "display_id",
        "custom_display_id",
        "status",
        "customer_id",
        "customer.*",
        "sales_channel_id",
        "sales_channel.*",
        "region_id",
        "region.*",
        "currency_code",
        "items.*",
        "items.variant.product.id",
        "items.variant.product.shipping_profile.id",
        "items.variant.weight",
        "items.variant.length",
        "items.variant.height",
        "items.variant.width",
        "items.variant.material",
        "items.variant_title",
        "items.variant.upc",
        "items.variant.sku",
        "items.variant.barcode",
        "items.variant.hs_code",
        "items.variant.origin_country",
        "items.variant.product.origin_country",
        "items.variant.product.hs_code",
        "items.variant.product.mid_code",
        "items.variant.product.material",
        "items.tax_lines.rate",
        "metadata",
        "subtotal",
        "discount_total",
        "tax_total",
        "item_total",
        "shipping_total",
        "total",
        "created_at",
        "shipping_address.*",
        "shipping_methods.id",
        "shipping_methods.shipping_option_id",
        "shipping_methods.data",
        "shipping_methods.amount",
      ],
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-order" })

    createOrderFulfillmentValidateOrderStep({ order, inputItems: input.items })

    const inputItemsMap = transform(input, ({ items }) => {
      return items.reduce(
        (acc, item) => {
          acc[item.id] = item
          return acc
        },
        {} as Record<
          string,
          OrderWorkflow.CreateOrderFulfillmentWorkflowInput["items"][number]
        >,
      )
    })

    const shippingOptionId = transform({ order, input }, (data) => {
      return (
        data.input.shipping_option_id ??
        data.order.shipping_methods?.[0]?.shipping_option_id
      )
    })

    const shippingMethod = transform({ order, shippingOptionId }, (data) => {
      return {
        data: data.order.shipping_methods?.find(
          (sm) => sm.shipping_option_id === data.shippingOptionId,
        )?.data,
      }
    })

    const shippingOption = useRemoteQueryStep({
      entry_point: "shipping_options",
      fields: [
        "id",
        "provider_id",
        "service_zone.fulfillment_set.location.id",
        "shipping_profile_id",
      ],
      variables: { id: shippingOptionId },
      list: false,
    }).config({ name: "get-shipping-option" })

    const lineItemIds = transform(
      { order, itemsList: input.items_list, inputItemsMap },
      ({ order, itemsList, inputItemsMap }) => {
        return (itemsList ?? order.items)!
          .map((i) => i.id)
          .filter((i) => i in inputItemsMap)
      },
    )

    const reservations = useRemoteQueryStep({
      entry_point: "reservations",
      fields: [
        "id",
        "line_item_id",
        "quantity",
        "inventory_item_id",
        "location_id",
      ],
      variables: { filter: { line_item_id: lineItemIds } },
    }).config({ name: "get-reservations" })

    const { data: lineItemOffers } = useQueryGraphStep({
      entity: "order_line_item",
      fields: [
        "id",
        "offer.id",
        "offer.inventory_item_link.required_quantity",
        "offer.inventory_item_link.inventory_item.id",
        "offer.inventory_item_link.inventory_item.title",
        "offer.inventory_item_link.inventory_item.sku",
      ],
      filters: { id: lineItemIds },
    }).config({ name: "get-line-item-offers" })

    const offerInventoryByLineItem = transform(
      { lineItemOffers },
      ({ lineItemOffers }) =>
        buildOfferInventoryByLineItem(lineItemOffers as LineItemOfferRow[]),
    )

    const fulfillmentData = transform(
      {
        order,
        input,
        shippingOption,
        shippingMethod,
        reservations,
        itemsList: input.items_list,
        offerInventoryByLineItem,
      },
      prepareFulfillmentData,
    )

    const fulfillment = createFulfillmentWorkflow.runAsStep(fulfillmentData)

    const registerOrderFulfillmentData = transform(
      {
        order,
        fulfillment,
        input,
        inputItemsMap,
        itemsList: input.items ?? input.items_list,
      },
      prepareRegisterOrderFulfillmentData,
    )

    const link = transform(
      { order_id: input.order_id, fulfillment },
      (data) => {
        return [
          {
            [Modules.ORDER]: { order_id: data.order_id },
            [Modules.FULFILLMENT]: { fulfillment_id: data.fulfillment.id },
          },
        ]
      },
    )

    const { toDelete, toUpdate, inventoryAdjustment } = transform(
      {
        order,
        reservations,
        input,
        inputItemsMap,
        itemsList: input.items_list,
        offerInventoryByLineItem,
      },
      prepareInventoryUpdate,
    )

    adjustInventoryLevelsStep(inventoryAdjustment)
    parallelize(
      registerOrderFulfillmentStep(registerOrderFulfillmentData),
      createRemoteLinkStep(link),
      updateReservationsStep(toUpdate),
      deleteReservationsStep(toDelete),
      emitEventStep({
        eventName: OrderWorkflowEvents.FULFILLMENT_CREATED,
        data: {
          order_id: input.order_id,
          fulfillment_id: fulfillment.id,
          no_notification: input.no_notification,
        },
      }),
    )

    const fulfillmentCreated = createHook("fulfillmentCreated", {
      fulfillment,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(fulfillment, {
      hooks: [fulfillmentCreated],
    })
  },
)
