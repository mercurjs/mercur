import { model } from "@medusajs/framework/utils"
import Seller from "./seller"

const ProfessionalDetails = model.define("ProfessionalDetails", {
  id: model.id({ prefix: "selprodet" }).primaryKey(),
  corporate_name: model.text(),
  registration_number: model.text().nullable(),
  tax_id: model.text().nullable(),
  seller: model.belongsTo(() => Seller, {
    mappedBy: "professional_details",
  }),
})

export default ProfessionalDetails
