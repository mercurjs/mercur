import {
  ContainerRegistrationKeys,
  Modules,
  OrderEditWorkflowEvents,
} from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import handler from "../../subscribers/link-order-line-items-to-offers"

type Item = {
  id: string
  variant_id: string | null
  metadata: Record<string, unknown> | null
  offer?: { id: string } | null
}

type Offer = { id: string; seller_id: string; variant_id: string }

const run = async (items: Item[], offers: Offer[], sellerId = "sel_own") => {
  const created: unknown[] = []
  const updates: { selector: { id: string }; data: { metadata: Record<string, unknown> } }[] = []
  const warnings: string[] = []

  const container = {
    resolve: (key: string) => {
      switch (key) {
        case ContainerRegistrationKeys.QUERY:
          return {
            graph: async ({ entity }: { entity: string }) =>
              entity === "orders"
                ? { data: [{ id: "order_1", seller: { id: sellerId }, items }] }
                : { data: offers },
          }
        case ContainerRegistrationKeys.LINK:
          return { create: async (pairs: unknown[]) => created.push(...pairs) }
        case ContainerRegistrationKeys.LOGGER:
          return { warn: (message: string) => warnings.push(message) }
        case Modules.ORDER:
          return { updateOrderLineItems: async (u: typeof updates) => updates.push(...u) }
        default:
          throw new Error(`unexpected resolve ${key}`)
      }
    },
  }

  await handler({
    event: { name: OrderEditWorkflowEvents.CONFIRMED, data: { order_id: "order_1" } },
    container,
  } as unknown as Parameters<typeof handler>[0])

  return { created, updates, warnings }
}

const ownOffer: Offer = { id: "off_own", seller_id: "sel_own", variant_id: "var_1" }
const foreignOffer: Offer = { id: "off_foreign", seller_id: "sel_other", variant_id: "var_1" }

describe("link-order-line-items-to-offers", () => {
  it("links an item to the order seller's offer on the same variant", async () => {
    const { created, updates } = await run(
      [{ id: "li_1", variant_id: "var_1", metadata: { offer_id: "off_own", note: "x" } }],
      [ownOffer]
    )

    expect(created).toEqual([
      {
        [Modules.ORDER]: { order_line_item_id: "li_1" },
        [MercurModules.OFFER]: { offer_id: "off_own" },
      },
    ])
    expect(updates).toEqual([{ selector: { id: "li_1" }, data: { metadata: { note: "x" } } }])
  })

  it("refuses another seller's offer and clears the marker", async () => {
    const { created, updates, warnings } = await run(
      [{ id: "li_1", variant_id: "var_1", metadata: { offer_id: "off_foreign" } }],
      [foreignOffer]
    )

    expect(created).toEqual([])
    expect(updates).toEqual([{ selector: { id: "li_1" }, data: { metadata: {} } }])
    expect(warnings[0]).toContain("different seller")
  })

  it("refuses an offer on a different variant", async () => {
    const { created, warnings } = await run(
      [{ id: "li_1", variant_id: "var_2", metadata: { offer_id: "off_own" } }],
      [ownOffer]
    )

    expect(created).toEqual([])
    expect(warnings[0]).toContain("variant")
  })

  it("skips items that are already linked or carry no marker", async () => {
    const { created, updates } = await run(
      [
        { id: "li_1", variant_id: "var_1", metadata: { offer_id: "off_own" }, offer: { id: "off_own" } },
        { id: "li_2", variant_id: "var_1", metadata: null },
      ],
      [ownOffer]
    )

    expect(created).toEqual([])
    expect(updates).toEqual([])
  })
})
