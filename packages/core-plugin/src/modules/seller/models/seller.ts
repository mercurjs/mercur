import { model } from "@medusajs/framework/utils"
import { SellerStatus } from "@mercurjs/types"
import ProfessionalDetails from "./professional-details"
import SellerAddress from "./address"
import PaymentDetails from "./payment-details"
import Member from "./member"
import SellerMember from "./seller-member"
import MemberInvite from "./member-invite"

const Seller = model
  .define("Seller", {
    id: model.id({ prefix: "sel" }).primaryKey(),
    name: model.text().searchable(),
    handle: model.text().searchable(),
    email: model.text().searchable(),
    description: model.text().nullable(),
    logo: model.text().nullable(),
    banner: model.text().nullable(),
    website_url: model.text().searchable().nullable(),
    external_id: model.text().searchable().nullable(),
    currency_code: model.text(),
    status: model.enum(SellerStatus).default(SellerStatus.PENDING_APPROVAL),
    status_reason: model.text().nullable(),
    is_premium: model.boolean().default(false),
    closed_from: model.dateTime().nullable(),
    closed_to: model.dateTime().nullable(),
    closure_note: model.text().nullable(),
    professional_details: model.hasOne(() => ProfessionalDetails, {
      mappedBy: "seller",
    }),
    address: model.hasOne(() => SellerAddress, {
      mappedBy: "seller",
    }),
    payment_details: model.hasOne(() => PaymentDetails, {
      mappedBy: "seller",
    }),
    members: model.manyToMany(() => Member, {
      mappedBy: "sellers",
      pivotEntity: () => SellerMember,
    }),
    member_invites: model.hasMany(() => MemberInvite, {
      mappedBy: "seller",
    }),
    metadata: model.json().nullable(),
  })
  .cascades({
    delete: ["professional_details", "address", "payment_details", "member_invites"],
    detach: ["members"],
  })
  .indexes([
    {
      on: ["email"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["name"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_seller_handle_unique",
      on: ["handle"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["external_id"],
      unique: true,
      where: "deleted_at IS NULL AND external_id IS NOT NULL",
    },
    {
      name: "IDX_seller_active_closure",
      on: ["status", "closed_from", "closed_to"],
      where: "deleted_at IS NULL",
    },
  ])

export default Seller
