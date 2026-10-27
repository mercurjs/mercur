import { MedusaRequest } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  promiseAll,
} from "@medusajs/framework/utils"
import {
  computeExpectedDelivery,
  ExpectedDelivery,
  getMarketplaceDefaultLeadtime,
  resolveLeadtimeToShip,
  resolveTransitDays,
} from "@mercurjs/types"

type DeliveryOrder = {
  id: string
  created_at: string | Date
  seller?: { id: string } | null
  items?: { offer?: { leadtime_to_ship: number | null } | null }[] | null
  shipping_methods?: { shipping_option_id: string | null }[] | null
}

type DeliveryShippingOption = {
  id: string
  metadata: Record<string, unknown> | null
  shipping_rule?: {
    transit_min_days: number | null
    transit_max_days: number | null
    shipping_method?: { cutoff_time: string | null } | null
  } | null
}

type DeliverySeller = {
  id: string
  default_leadtime_to_ship: number | null
  closed_from: string | Date | null
  closed_to: string | Date | null
}

type OrderWithExpectedDelivery = {
  id: string
  expected_delivery?: ExpectedDelivery | null
}

const maxDay = (a: string | null, b: string | null) =>
  a === null ? b : b === null ? a : a > b ? a : b

const latestOf = (deliveries: ExpectedDelivery[]): ExpectedDelivery =>
  deliveries.reduce((acc, delivery) => ({
    shipping_deadline:
      maxDay(acc.shipping_deadline, delivery.shipping_deadline) ??
      acc.shipping_deadline,
    earliest: maxDay(acc.earliest, delivery.earliest),
    latest: maxDay(acc.latest, delivery.latest),
  }))

/**
 * Sets `expected_delivery` on each order, computed when read rather than
 * stored: the order's creation time, the longest lead time among its offers,
 * and the transit and cut-off of its shipping methods' rules. Orders whose
 * methods carry no transit time get `null`.
 */
export const wrapOrdersWithExpectedDelivery = async (
  req: Pick<MedusaRequest, "scope">,
  orders: OrderWithExpectedDelivery[]
): Promise<void> => {
  if (!orders.length) {
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: rows } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "created_at",
      "seller.id",
      "items.offer.leadtime_to_ship",
      "shipping_methods.shipping_option_id",
    ],
    filters: { id: orders.map((order) => order.id) },
  })
  const deliveryOrders = rows as unknown as DeliveryOrder[]

  const optionIds = Array.from(
    new Set(
      deliveryOrders.flatMap((order) =>
        (order.shipping_methods ?? [])
          .map((method) => method.shipping_option_id)
          .filter((id): id is string => !!id)
      )
    )
  )
  const sellerIds = Array.from(
    new Set(
      deliveryOrders
        .map((order) => order.seller?.id)
        .filter((id): id is string => !!id)
    )
  )

  const [{ data: options }, { data: sellers }, { data: stores }] =
    await promiseAll([
      optionIds.length
        ? query.graph({
            entity: "shipping_option",
            fields: [
              "id",
              "metadata",
              "shipping_rule.transit_min_days",
              "shipping_rule.transit_max_days",
              "shipping_rule.shipping_method.cutoff_time",
            ],
            filters: { id: optionIds },
          })
        : Promise.resolve({ data: [] }),
      sellerIds.length
        ? query.graph({
            entity: "seller",
            fields: [
              "id",
              "default_leadtime_to_ship",
              "closed_from",
              "closed_to",
            ],
            filters: { id: sellerIds },
          })
        : Promise.resolve({ data: [] }),
      query.graph({
        entity: "store",
        fields: ["id", "metadata"],
        pagination: { take: 1 },
      }),
    ])

  const optionById = new Map(
    (options as unknown as DeliveryShippingOption[]).map((option) => [
      option.id,
      option,
    ])
  )
  const sellerById = new Map(
    (sellers as unknown as DeliverySeller[]).map((seller) => [seller.id, seller])
  )
  const marketplaceLeadtime = getMarketplaceDefaultLeadtime(
    (stores[0] as { metadata?: Record<string, unknown> | null } | undefined)
      ?.metadata
  )

  const byOrderId = new Map<string, ExpectedDelivery | null>()
  for (const order of deliveryOrders) {
    const seller = order.seller?.id
      ? sellerById.get(order.seller.id)
      : undefined
    const leadtimes = (order.items ?? [])
      .map((item) =>
        resolveLeadtimeToShip(
          item.offer?.leadtime_to_ship,
          seller?.default_leadtime_to_ship,
          marketplaceLeadtime
        )
      )
      .filter((days): days is number => days !== null)
    const leadtime = leadtimes.length
      ? Math.max(...leadtimes)
      : resolveLeadtimeToShip(
          null,
          seller?.default_leadtime_to_ship,
          marketplaceLeadtime
        )

    const deliveries: ExpectedDelivery[] = []
    for (const method of order.shipping_methods ?? []) {
      const option = method.shipping_option_id
        ? optionById.get(method.shipping_option_id)
        : undefined
      if (!option) {
        continue
      }
      const transit = resolveTransitDays(option.metadata, option.shipping_rule)
      if (transit.min === null && transit.max === null) {
        continue
      }
      deliveries.push(
        computeExpectedDelivery({
          start: order.created_at,
          leadtimeDays: leadtime,
          transitMinDays: transit.min,
          transitMaxDays: transit.max,
          closure: seller,
          cutoffTime: option.shipping_rule?.shipping_method?.cutoff_time,
        })
      )
    }

    byOrderId.set(order.id, deliveries.length ? latestOf(deliveries) : null)
  }

  for (const order of orders) {
    order.expected_delivery = byOrderId.get(order.id) ?? null
  }
}
