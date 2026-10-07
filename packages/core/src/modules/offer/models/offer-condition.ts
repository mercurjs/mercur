import { model } from "@medusajs/framework/utils"

import Offer from "./offer"

const OfferCondition = model
  .define("OfferCondition", {
    id: model.id({ prefix: "ofcond" }).primaryKey(),
    code: model.text().searchable(),
    label: model.text().searchable(),
    is_active: model.boolean().default(true),
    rank: model.number().default(0),
    metadata: model.json().nullable(),
    offers: model.hasMany(() => Offer, { mappedBy: "condition" }),
  })
  .indexes([
    {
      name: "IDX_offer_condition_code_unique",
      on: ["code"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default OfferCondition
