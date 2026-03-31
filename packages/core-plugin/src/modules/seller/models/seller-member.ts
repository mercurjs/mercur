import { model } from "@medusajs/framework/utils"
import Seller from "./seller"
import Member from "./member"

const SellerMember = model.define("SellerMember", {
  id: model.id({ prefix: "selmem" }).primaryKey(),
  seller: model.belongsTo(() => Seller, {
    mappedBy: "members",
  }),
  member: model.belongsTo(() => Member, {
    mappedBy: "sellers",
  }),
  role_id: model.text().nullable(),
  is_owner: model.boolean().default(false),
  metadata: model.json().nullable(),
})
  .indexes([
    {
      on: ["seller_id", "member_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default SellerMember
