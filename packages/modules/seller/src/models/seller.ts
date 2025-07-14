import { model } from "@medusajs/framework/utils";

import { StoreStatus } from "@mercurjs/framework";
import { MemberInvite } from "./invite";
import { Member } from "./member";
import { SellerOnboarding } from "./onboarding";

/**
 * @class Seller
 * @description Represents a seller in the system.
 *
 * This model defines the structure for storing seller information. Each seller
 * is associated with a specific store status, name, handle, description, photo,
 * email, phone, address line, city, state, postal code, country code, tax id,
 * members, invites, and onboarding.
 */
export const Seller = model.define("seller", {
  /**
   * @property {string} id - The ID of the seller.
   * @description Auto-generated primary key with prefix 'sel'
   * @example "sel_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "sel" }).primaryKey(),
  /**
   * @property {StoreStatus} store_status - The store status of the seller.
   * @description The store status of the seller.
   * @example "active"
   */
  store_status: model.enum(StoreStatus).default(StoreStatus.ACTIVE),
  /**
   * @property {string} name - The name of the seller.
   * @description The name of the seller.
   * @example "John Doe"
   */
  name: model.text().searchable(),
  /**
   * @property {string} handle - The handle of the seller.
   * @description The handle of the seller.
   * @example "john-doe"
   */
  handle: model.text().unique(),
  /**
   * @property {string} description - The description of the seller.
   * @description The description of the seller.
   * @example "I am a software engineer"
   */
  description: model.text().searchable().nullable(),
  /**
   * @property {string} photo - The photo of the seller.
   * @description The photo of the seller.
   * @example "https://example.com/photo.jpg"
   */
  photo: model.text().nullable(),
  /**
   * @property {string} email - The email of the seller.
   * @description The email of the seller.
   * @example "john.doe@example.com"
   */
  email: model.text().nullable(),
  /**
   * @property {string} phone - The phone of the seller.
   * @description The phone of the seller.
   * @example "+1234567890"
   */
  phone: model.text().nullable(),
  /**
   * @property {string} address_line - The address line of the seller.
   * @description The address line of the seller.
   * @example "123 Main St"
   */
  address_line: model.text().nullable(),
  /**
   * @property {string} city - The city of the seller.
   * @description The city of the seller.
   * @example "New York"
   */
  city: model.text().nullable(),
  /**
   * @property {string} state - The state of the seller.
   * @description The state of the seller.
   * @example "NY"
   */
  state: model.text().nullable(),
  /**
   * @property {string} postal_code - The postal code of the seller.
   * @description The postal code of the seller.
   * @example "10001"
   */
  postal_code: model.text().nullable(),
  /**
   * @property {string} country_code - The country code of the seller.
   * @description The country code of the seller.
   * @example "US"
   */
  country_code: model.text().nullable(),
  /**
   * @property {string} tax_id - The tax id of the seller.
   * @description The tax id of the seller.
   * @example "1234567890"
   */
  tax_id: model.text().nullable(),
  /**
   * @property {Member[]} members - The members of the seller.
   * @description The members of the seller.
   */
  members: model.hasMany(() => Member),
  /**
   * @property {MemberInvite[]} invites - The invites of the seller.
   * @description The invites of the seller.
   */
  invites: model.hasMany(() => MemberInvite),
  /**
   * @property {SellerOnboarding} onboarding - The onboarding of the seller.
   * @description The onboarding of the seller.
   */
  onboarding: model.hasOne(() => SellerOnboarding).nullable(),
});
