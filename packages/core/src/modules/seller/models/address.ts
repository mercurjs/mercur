import { model } from "@medusajs/framework/utils"
import Seller from "./seller"

const SellerAddress = model.define("SellerAddress", {
  id: model.id({ prefix: "seladdr" }).primaryKey(),
  name: model.text().searchable().nullable(),
  company: model.text().searchable().nullable(),
  first_name: model.text().searchable().nullable(),
  last_name: model.text().searchable().nullable(),
  address_1: model.text().searchable().nullable(),
  address_2: model.text().searchable().nullable(),
  city: model.text().searchable().nullable(),
  country_code: model.text().nullable(),
  province: model.text().searchable().nullable(),
  postal_code: model.text().searchable().nullable(),
  phone: model.text().nullable(),
  metadata: model.json().nullable(),
  seller: model.belongsTo(() => Seller, {
    mappedBy: "address",
  }),
})

export default SellerAddress
