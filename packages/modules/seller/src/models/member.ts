import { model } from "@medusajs/framework/utils";

import { MemberRole } from "@mercurjs/framework";
import { Seller } from "./seller";

/**
 * @class Member
 * @description Represents a member in the system.
 *
 * This model defines the structure for storing member information. Each member
 * is associated with a specific seller, role, name, email, bio, phone, photo, and seller.
 */
export const Member = model.define("member", {
  /**
   * @property {string} id - The ID of the member.
   * @description Auto-generated primary key with prefix 'mem'
   * @example "mem_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "mem" }).primaryKey(),
  /**
   * @property {MemberRole} role - The role of the member.
   * @description The role of the member.
   * @example "owner"
   */
  role: model.enum(MemberRole).default(MemberRole.OWNER),
  /**
   * @property {string} name - The name of the member.
   * @description The name of the member.
   * @example "John Doe"
   */
  name: model.text().searchable(),
  /**
   * @property {string} email - The email of the member.
   * @description The email of the member.
   * @example "john.doe@example.com"
   */
  email: model.text().nullable(),
  /**
   * @property {string} bio - The bio of the member.
   * @description The bio of the member.
   * @example "I am a software engineer"
   */
  bio: model.text().searchable().nullable(),
  /**
   * @property {string} phone - The phone of the member.
   * @description The phone of the member.
   * @example "+1234567890"
   */
  phone: model.text().searchable().nullable(),
  /**
   * @property {string} photo - The photo of the member.
   * @description The photo of the member.
   * @example "https://example.com/photo.jpg"
   */
  photo: model.text().nullable(),
  /**
   * @property {Seller} seller - The seller of the member.
   * @description The seller of the member.
   */
  seller: model.belongsTo(() => Seller, { mappedBy: "members" }),
});
