import i18n from "i18next"
import { z } from "zod"
import {
  PriceListCreateOffersSchema,
  PriceListRulesSchema,
} from "../../../common/schemas"

const PricingCustomerGroupsArray = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
  })
)

export type PricingCustomerGroupsArrayType = z.infer<
  typeof PricingCustomerGroupsArray
>

export const PricingCreateSchema = z.object({
  type: z.enum(["sale", "override"]),
  status: z.enum(["draft", "active"]),
  title: z.string().min(1, i18n.t("priceLists.create.validation.title")),
  description: z
    .string()
    .min(1, i18n.t("priceLists.create.validation.description")),
  starts_at: z.date().nullish(),
  ends_at: z.date().nullish(),
  product_ids: z.array(z.object({ id: z.string() })).min(1),
  // Offer ids selected in the picker (every variant of the chosen store+product
  // groups). The Prices tab hydrates `offers` from these.
  offer_ids: z.array(z.string()).default([]),
  // Offer-keyed prices (offer_id -> { variant_id, prices }), so the same variant
  // from two sellers stays separate.
  offers: PriceListCreateOffersSchema.default({}),
  rules: PriceListRulesSchema.nullish(),
})

export type PricingCreateSchemaType = z.infer<typeof PricingCreateSchema>

export const PricingDetailsSchema = PricingCreateSchema.pick({
  type: true,
  title: true,
  description: true,
  starts_at: true,
  ends_at: true,
})

export const PricingDetailsFields = Object.keys(
  PricingDetailsSchema.shape
) as (keyof typeof PricingDetailsSchema.shape)[]

export const PricingProductsSchema = PricingCreateSchema.pick({
  product_ids: true,
})

export const PricingProductsFields = Object.keys(
  PricingProductsSchema.shape
) as (keyof typeof PricingProductsSchema.shape)[]

export const PricingPricesSchema = PricingCreateSchema.pick({
  offers: true,
})

export const PricingPricesFields = Object.keys(
  PricingPricesSchema.shape
) as (keyof typeof PricingPricesSchema.shape)[]
