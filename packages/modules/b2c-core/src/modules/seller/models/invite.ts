import { model } from "@medusajs/framework/utils";

import { MemberRole } from "@mercurjs/framework";
import { Seller } from "./seller";

export const MemberInvite = model.define("member_invite", {
  id: model.id({ prefix: "meminv" }).primaryKey(),
  email: model.text(),
  role: model.enum(MemberRole).default(MemberRole.OWNER),
  seller: model.belongsTo(() => Seller, { mappedBy: "invites" }),
  token: model.text(),
  expires_at: model.dateTime(),
  accepted: model.boolean().default(false),
});
