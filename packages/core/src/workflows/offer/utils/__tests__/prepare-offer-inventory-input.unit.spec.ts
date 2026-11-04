import {
  OfferInventoryShape,
  prepareOfferInventoryInput,
} from "../prepare-offer-inventory-input"

const level = (
  locationId: string,
  stocked: number,
  channelIds: string[] = [],
) => ({
  location_id: locationId,
  stocked_quantity: stocked,
  reserved_quantity: 0,
  stock_locations: [
    { id: locationId, sales_channels: channelIds.map((id) => ({ id })) },
  ],
})

const offer = (
  levels: ReturnType<typeof level>[],
  overrides: Partial<OfferInventoryShape> = {},
): OfferInventoryShape => ({
  id: "offer_1",
  manage_inventory: true,
  allow_backorder: false,
  inventory_item_link: [
    { required_quantity: 1, inventory_item: { id: "iitem_1", location_levels: levels } },
  ],
  ...overrides,
})

const prepare = (
  offers: OfferInventoryShape[],
  salesChannelId?: string,
  quantity = 1,
) =>
  prepareOfferInventoryInput({
    input: {
      sales_channel_id: salesChannelId,
      items: [{ id: "li_1", quantity, offer: { id: "offer_1" } }],
      offers,
    },
  })

describe("prepareOfferInventoryInput", () => {
  const levels = [
    level("sloc_channel", 5, ["sc_1"]),
    level("sloc_other", 50, ["sc_2"]),
  ]

  it("only draws on the sales channel's locations", () => {
    const { items } = prepare([offer(levels)], "sc_1")
    expect(items).toHaveLength(1)
    expect(items[0].location_ids).toEqual(["sloc_channel"])
  })

  it("lists locations with enough stock first", () => {
    const { items } = prepare(
      [offer([level("sloc_low", 1, ["sc_1"]), level("sloc_full", 10, ["sc_1"])])],
      "sc_1",
      3,
    )
    expect(items[0].location_ids).toEqual(["sloc_full", "sloc_low"])
  })

  it("uses every stocked location when the cart has no sales channel", () => {
    const { items } = prepare([offer(levels)])
    expect(items[0].location_ids.sort()).toEqual(["sloc_channel", "sloc_other"])
  })

  it("rejects a managed offer with no location on the channel", () => {
    expect(() => prepare([offer(levels)], "sc_3")).toThrow(
      "Sales channel sc_3 is not associated with any stock location for offer offer_1.",
    )
  })

  it("lets backorderable and unmanaged offers fall back to their stocked locations", () => {
    const stocked = ["sloc_channel", "sloc_other"]
    const backorder = prepare([offer(levels, { allow_backorder: true })], "sc_3").items[0]
    expect(backorder.allow_backorder).toBe(true)
    expect(backorder.location_ids.sort()).toEqual(stocked)
    const unmanaged = prepare([offer(levels, { manage_inventory: false })], "sc_3").items[0]
    expect(unmanaged.manage_inventory).toBe(false)
    expect(unmanaged.location_ids.sort()).toEqual(stocked)
  })

  it("multiplies the required quantity by the line quantity", () => {
    const { items } = prepare(
      [
        offer([level("sloc_1", 10, ["sc_1"])], {
          inventory_item_link: [
            {
              required_quantity: 4,
              inventory_item: { id: "iitem_1", location_levels: [level("sloc_1", 10, ["sc_1"])] },
            },
          ],
        }),
      ],
      "sc_1",
      3,
    )
    expect(items[0]).toEqual(
      expect.objectContaining({ required_quantity: 4, quantity: 3, location_ids: ["sloc_1"] }),
    )
  })
})
