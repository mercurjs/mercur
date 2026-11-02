import { orderLinkModules } from "../link-order"

const registered = new Set(["order-order_id-offer-offer_id"])
const lookup = (a: string, aKey: string, b: string, bKey: string) =>
  registered.has([a, aKey, b, bKey].join("-")) || undefined

describe("orderLinkModules", () => {
  it("keeps a link whose modules are already in the registered order", () => {
    const link = {
      order: { order_id: "order_1" },
      offer: { offer_id: "offer_1" },
    }

    expect(orderLinkModules(link, lookup)).toBe(link)
  })

  it("restores the registered order after jsonb sorted the keys", () => {
    const link = {
      offer: { offer_id: "offer_1" },
      order: { order_id: "order_1" },
      data: { note: "kept" },
    }

    expect(Object.keys(orderLinkModules(link, lookup))).toEqual([
      "order",
      "offer",
      "data",
    ])
    expect(orderLinkModules(link, lookup).data).toEqual({ note: "kept" })
  })

  it("leaves a link alone when neither direction is registered", () => {
    const link = {
      cart: { cart_id: "cart_1" },
      order: { order_id: "order_1" },
    }

    expect(orderLinkModules(link, lookup)).toBe(link)
  })
})
