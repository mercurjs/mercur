import { model } from "@medusajs/framework/utils"
import Seller from "./seller"

const PaymentDetails = model.define("PaymentDetails", {
  id: model.id({ prefix: "selpaydet" }).primaryKey(),
  type: model.text().default("iban"),
  holder_name: model.text(),
  bank_name: model.text().nullable(),
  iban: model.text().nullable(),
  bic: model.text().nullable(),
  routing_number: model.text().nullable(),
  account_number: model.text().nullable(),
  seller: model.belongsTo(() => Seller, {
    mappedBy: "payment_details",
  }),
})

export default PaymentDetails
