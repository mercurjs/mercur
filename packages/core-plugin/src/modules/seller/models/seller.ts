import { model } from "@medusajs/framework/utils"
import { SellerStatus } from "@mercurjs/types"

const Seller = model.define("seller", {
  id: model.id({ prefix: "slr" }).primaryKey(),
  name: model.text().searchable(),
  handle: model.text().unique(),
  email: model.text(),
  phone: model.text().nullable(),
  logo: model.text().nullable(),
  cover_image: model.text().nullable(),
  address_1: model.text().nullable(),
  address_2: model.text().nullable(),
  city: model.text().nullable(),
  country_code: model.text().nullable(),
  province: model.text().nullable(),
  postal_code: model.text().nullable(),
  status: model.enum(SellerStatus).default(SellerStatus.PENDING),
})

export default Seller
