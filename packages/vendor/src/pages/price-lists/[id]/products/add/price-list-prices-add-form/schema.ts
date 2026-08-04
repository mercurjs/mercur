import i18n from "i18next"
import { z } from "zod"

import { PriceListCreateOffersSchema } from "../../../../common/schemas"

const hasAmount = (amount: unknown) =>
  amount !== undefined &&
  amount !== null &&
  amount !== "" &&
  (typeof amount === "number" ? amount > 0 : String(amount).trim() !== "")

const PriceListPricesAddBaseSchema = z.object({
  product_ids: z.array(z.object({ id: z.string() })).min(1),
  offer_ids: z.array(z.string()).default([]),
  offers: PriceListCreateOffersSchema.default({}),
})

export const PriceListPricesAddProductIdsSchema =
  PriceListPricesAddBaseSchema.pick({
    product_ids: true,
  })

export const PriceListPricesAddProductsIdsFields = Object.keys(
  PriceListPricesAddProductIdsSchema.shape
) as (keyof typeof PriceListPricesAddProductIdsSchema.shape)[]

export const PriceListPricesAddProductsSchema =
  PriceListPricesAddBaseSchema.pick({
    offers: true,
  })

export const PriceListPricesAddProductsFields = Object.keys(
  PriceListPricesAddProductsSchema.shape
) as (keyof typeof PriceListPricesAddProductsSchema.shape)[]

export const PriceListPricesAddSchema = PriceListPricesAddBaseSchema.refine(
  (data) => {
    // At least one offer must carry a price with an amount.
    for (const offer of Object.values(data.offers)) {
      const hasCurrency = Object.values(offer.currency_prices || {}).some((p) =>
        hasAmount(p?.amount)
      )
      const hasRegion = Object.values(offer.region_prices || {}).some((p) =>
        hasAmount(p?.amount)
      )
      if (hasCurrency || hasRegion) {
        return true
      }
    }
    return false
  },
  {
    message: i18n.t("validation.atLeastOnePrice"),
    path: ["offers"],
  }
)

export type PriceListPricesAddSchema = z.infer<typeof PriceListPricesAddSchema>
