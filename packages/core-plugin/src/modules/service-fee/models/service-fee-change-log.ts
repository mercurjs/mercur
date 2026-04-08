import { model } from "@medusajs/framework/utils"

const ServiceFeeChangeLog = model.define("service_fee_change_log", {
  id: model.id({ prefix: "sflog" }).primaryKey(),
  service_fee_id: model.text(),
  action: model.text(),
  changed_by: model.text().nullable(),
  previous_snapshot: model.json().nullable(),
  new_snapshot: model.json().nullable(),
})

export default ServiceFeeChangeLog
