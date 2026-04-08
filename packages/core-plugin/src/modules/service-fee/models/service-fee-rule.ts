import { model } from "@medusajs/framework/utils"
import ServiceFee from "./service-fee"

const ServiceFeeRule = model.define("service_fee_rule", {
  id: model.id({ prefix: "sfrule" }).primaryKey(),
  reference: model.text(),
  reference_id: model.text(),
  mode: model.text().default("include"),
  service_fee: model.belongsTo(() => ServiceFee, {
    mappedBy: "rules",
  }),
})

export default ServiceFeeRule
