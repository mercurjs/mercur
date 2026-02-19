import { model } from "@medusajs/framework/utils"

export const MemberInvite = model.define("member_invite", {
  id: model.id({ prefix: "meminv" }).primaryKey(),
  email: model.text(),
  role: model.enum(["owner", "admin", "member"]).default("owner"),
  token: model.text(),
  expires_at: model.dateTime(),
  accepted: model.boolean().default(false),
})
