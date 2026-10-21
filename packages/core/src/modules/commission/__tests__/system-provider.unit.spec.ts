import { CommissionCalculationContext } from "@mercurjs/types"

import { SystemCommissionProvider } from "../providers/system"

const rates = [
  {
    id: "rate_default",
    code: "default",
    type: "percentage",
    value: 10,
    is_enabled: true,
    is_default: true,
    include_tax: false,
    include_shipping: true,
    currency_code: null,
    created_at: new Date("2026-01-01T00:00:00Z"),
    rules: [],
    values: [],
  },
  {
    id: "rate_seller",
    code: "seller-a",
    type: "percentage",
    value: 20,
    is_enabled: true,
    is_default: false,
    include_tax: false,
    include_shipping: false,
    currency_code: null,
    created_at: new Date("2026-01-02T00:00:00Z"),
    rules: [{ reference: "seller", reference_id: "seller_a" }],
    values: [],
  },
]

const buildProvider = () => {
  const list = jest.fn(async () => rates)
  const provider = new SystemCommissionProvider({
    commissionRateService: { list } as never,
  })
  return { provider, list }
}

const contexts: CommissionCalculationContext[] = [
  {
    order_id: "order_a",
    currency_code: "usd",
    items: [
      {
        id: "item_a",
        subtotal: 100,
        product: { id: "prod_a", seller: { id: "seller_a" } },
      },
    ],
    shipping_methods: [{ id: "sm_a", subtotal: 10 }],
  },
  {
    order_id: "order_b",
    currency_code: "usd",
    items: [
      {
        id: "item_b",
        subtotal: 50,
        product: { id: "prod_b", seller: { id: "seller_b" } },
      },
    ],
    shipping_methods: [],
  },
]

describe("SystemCommissionProvider.getCommissionLinesBatch", () => {
  it("loads the rate table once for the whole batch", async () => {
    const { provider, list } = buildProvider()

    const batches = await provider.getCommissionLinesBatch(contexts)

    expect(list).toHaveBeenCalledTimes(1)
    expect(batches).toHaveLength(2)
    expect(batches[0]).toEqual([
      expect.objectContaining({ item_id: "item_a", code: "seller-a", amount: 20 }),
      expect.objectContaining({ shipping_method_id: "sm_a", code: "default", amount: 1 }),
    ])
    expect(batches[1]).toEqual([
      expect.objectContaining({ item_id: "item_b", code: "default", amount: 5 }),
    ])
  })

  it("returns the same lines as the per-context method, in order", async () => {
    const { provider } = buildProvider()

    const batches = await provider.getCommissionLinesBatch(contexts)
    const single = await Promise.all(
      contexts.map((context) => provider.getCommissionLines(context))
    )

    expect(batches).toEqual(single)
  })

  it("skips the rate query for an empty batch", async () => {
    const { provider, list } = buildProvider()

    await expect(provider.getCommissionLinesBatch([])).resolves.toEqual([])
    expect(list).not.toHaveBeenCalled()
  })
})
