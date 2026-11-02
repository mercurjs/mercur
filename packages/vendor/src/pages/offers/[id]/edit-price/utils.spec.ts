import { describe, expect, test } from "vitest"

import { buildPricePayload, buildRows, PriceProduct } from "./utils"

const eurRegion = { id: "reg_eu", currency_code: "eur" }

const product = {
  id: "prod_1",
  thumbnail: null,
  variants: [
    {
      id: "variant_1",
      title: "Default",
      offers: [
        {
          id: "offer_1",
          prices: [
            {
              amount: 1200,
              currency_code: "eur",
              price_rules: [{ attribute: "offer_id", value: "offer_1" }],
            },
            {
              amount: 1100,
              currency_code: "eur",
              price_rules: [
                { attribute: "offer_id", value: "offer_1" },
                { attribute: "region_id", value: "reg_eu" },
              ],
            },
          ],
        },
      ],
    },
  ],
} as unknown as PriceProduct

describe("offer edit-price grid", () => {
  test("rows carry the offer's current base and region prices", () => {
    const [row] = buildRows(product, ["eur"], [eurRegion])

    expect(row.prices).toEqual({ eur: 1200 })
    expect(row.region_prices).toEqual({ reg_eu: 1100 })
  })

  test("rows built before the regions arrive would drop every price", () => {
    const [row] = buildRows(product, [], [])

    expect(buildPricePayload(row, [], [])).toEqual([])
  })

  test("an unedited row resends the prices it was built from", () => {
    const [row] = buildRows(product, ["eur"], [eurRegion])

    expect(buildPricePayload(row, ["eur"], [eurRegion])).toEqual([
      { amount: 1200, currency_code: "eur" },
      {
        amount: 1100,
        currency_code: "eur",
        rules: { region_id: "reg_eu" },
      },
    ])
  })

  test("cleared cells are left out of the payload", () => {
    const [row] = buildRows(product, ["eur"], [eurRegion])
    row.region_prices.reg_eu = ""

    expect(buildPricePayload(row, ["eur"], [eurRegion])).toEqual([
      { amount: 1200, currency_code: "eur" },
    ])
  })
})
