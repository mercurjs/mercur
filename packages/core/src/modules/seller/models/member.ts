import { model } from "@medusajs/framework/utils"
import Seller from "./seller"
import SellerMember from "./seller-member"

const Member = model
  .define("Member", {
    id: model.id({ prefix: "mem" }).primaryKey(),
    email: model.text().searchable(),
    first_name: model.text().searchable().nullable(),
    last_name: model.text().searchable().nullable(),
    locale: model.text().nullable(),
    is_active: model.boolean().default(true),
    sellers: model.manyToMany(() => Seller, {
      mappedBy: "members",
      pivotEntity: () => SellerMember,
    }),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["email"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default Member
