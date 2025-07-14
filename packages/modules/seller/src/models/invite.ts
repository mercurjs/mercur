import { model } from "@medusajs/framework/utils";

import { MemberRole } from "@mercurjs/framework";
import { Seller } from "./seller";

/**
 * @class MemberInvite
 * @description Represents a member invite in the system.
 *
 * This model defines the structure for storing member invite information. Each invite
 * is associated with a specific seller, email, role, token, expiration date, and acceptance status.
 */
export const MemberInvite = model.define("member_invite", {
  /**
   * @property {string} id - The ID of the member invite.
   * @description Auto-generated primary key with prefix 'meminv'
   * @example "meminv_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "meminv" }).primaryKey(),
  /**
   * @property {string} email - The email of the member invite.
   * @description The email of the member invite.
   * @example "john.doe@example.com"
   */
  email: model.text(),
  /**
   * @property {MemberRole} role - The role of the member invite.
   * @description The role of the member invite.
   * @example "owner"
   */
  role: model.enum(MemberRole).default(MemberRole.OWNER),
  /**
   * @property {Seller} seller - The seller of the member invite.
   * @description The seller of the member invite.
   * @example "seller_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  seller: model.belongsTo(() => Seller, { mappedBy: "invites" }),
  /**
   * @property {string} token - The token of the member invite.
   * @description The token of the member invite.
   */
  token: model.text(),
  /**
   * @property {Date} expires_at - The expiration date of the member invite.
   * @description The expiration date of the member invite.
   * @example "2025-01-01T00:00:00.000Z"
   */
  expires_at: model.dateTime(),
  /**
   * @property {boolean} accepted - The accepted status of the member invite.
   * @description The accepted status of the member invite.
   * @example true
   */
  accepted: model.boolean().default(false),
});
