import { model } from "@medusajs/framework/utils"

export const Member = model.define("member", {
  id: model.id({ prefix: "mem" }).primaryKey(),
  seller_id: model.text(),
  role: model.enum(["owner", "admin", "member"]).default("owner"),
  name: model.text().searchable(),
  email: model.text().nullable(),
  bio: model.text().searchable().nullable(),
  phone: model.text().searchable().nullable(),
  photo: model.text().nullable(),
})
