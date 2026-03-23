import { model } from "@medusajs/framework/utils"
import Seller from "./seller"

const MemberInvite = model
  .define("MemberInvite", {
    id: model.id({ prefix: "meminv" }).primaryKey(),
    email: model.text().searchable(),
    token: model.text(),
    accepted: model.boolean().default(false),
    expires_at: model.dateTime(),
    role_handle: model.text(),
    seller: model.belongsTo(() => Seller, {
      mappedBy: "member_invites",
    }),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["email", "seller_id"],
      unique: true,
      where: "deleted_at IS NULL AND accepted = false",
    },
    {
      on: ["token"],
      where: "deleted_at IS NULL",
    },
  ])

export default MemberInvite
