import { model } from "@medusajs/framework/utils"
import {
  ServiceFeeType,
  ServiceFeeTarget,
  ServiceFeeChargingLevel,
  ServiceFeeStatus,
} from "@mercurjs/types"
import ServiceFeeRule from "./service-fee-rule"

const ServiceFee = model.define("service_fee", {
  id: model.id({ prefix: "srvfee" }).primaryKey(),
  is_enabled: model.boolean().default(true),
  priority: model.number().default(0),
  currency_code: model.text().nullable(),
  name: model.text(),
  display_name: model.text(),
  code: model.text(),
  type: model.enum(ServiceFeeType),
  target: model.enum(ServiceFeeTarget).default(ServiceFeeTarget.ITEM),
  charging_level: model.enum(ServiceFeeChargingLevel),
  status: model.enum(ServiceFeeStatus).default(ServiceFeeStatus.ACTIVE),
  value: model.bigNumber(),
  min_amount: model.bigNumber().nullable(),
  max_amount: model.bigNumber().nullable(),
  include_tax: model.boolean().default(false),
  effective_date: model.dateTime().nullable(),
  start_date: model.dateTime().nullable(),
  end_date: model.dateTime().nullable(),
  replaces_fee_id: model.text().nullable(),
  rules: model.hasMany(() => ServiceFeeRule, {
    mappedBy: "service_fee",
  }),
})

export default ServiceFee
