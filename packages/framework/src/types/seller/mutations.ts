import { MemberInviteDTO, MemberRole, SellerDTO, StoreStatus } from "./common";

/**
 * @interface
 * The seller to be created.
 * @property {string} name - The name of the seller
 */
export interface CreateSellerDTO
  extends Omit<
    Partial<SellerDTO>,
    "id" | "created_at" | "updated_at" | "members"
  > {
  /**
 * *
 * The name of the seller

 */
  name: string;
}

/**
 * @interface
 * The attributes to update in the seller.
 *
 * @property {string} id - The ID of the seller
 * @property {string} name - The name of the seller
 * @property {string} email - The email of the seller
 * @property {string} phone - The phone of the seller
 * @property {string} description - The description of the seller
 * @property {string} address_line - The address line of the seller
 * @property {string} city - The city of the seller
 * @property {string} state - The state of the seller
 * @property {string} postal_code - The postal code of the seller
 * @property {string} country_code - The country code of the seller
 * @property {string} tax_id - The associated tax's ID.
 * @property {string} handle - The handle of the seller
 * @property {string} photo - The photo of the seller
 * @property {StoreStatus} store_status - The store status of the seller
 */
export interface UpdateSellerDTO {
  /**
 * *
 * The ID of the seller.

 */
  id: string;
  /**
 * *
 * The name of the seller

 */
  name?: string;
  /**
 * *
 * The email of the seller

 */
  email?: string;
  /**
 * *
 * The phone of the seller

 */
  phone?: string;
  /**
 * *
 * The description of the seller

 */
  description?: string;
  /**
 * *
 * The address line of the seller

 */
  address_line?: string;
  /**
 * *
 * The city of the seller

 */
  city?: string;
  /**
 * *
 * The state of the seller

 */
  state?: string;
  /**
 * *
 * The postal code of the seller

 */
  postal_code?: string;
  /**
 * *
 * The country code of the seller

 */
  country_code?: string;
  /**
 * *
 * The associated tax's ID.

 */
  tax_id?: string;
  /**
 * *
 * The handle of the seller

 */
  handle?: string;
  /**
 * *
 * The photo of the seller

 */
  photo?: string;
  /**
 * *
 * The store status of the seller

 */
  store_status?: StoreStatus;
}

/**
 * @interface
 * The member to be created.
 * @property {string} seller_id - The associated seller's ID.
 * @property {MemberRole} role - The role of the member
 * @property {string} name - The name of the member
 * @property {string} email - The email of the member
 * @property {string} bio - The bio of the member
 * @property {string} photo - The photo of the member
 * @property {string} phone - The phone of the member
 */
export interface CreateMemberDTO {
  /**
 * *
 * The associated seller's ID.

 */
  seller_id: string;
  /**
 * *
 * The role of the member

 */
  role?: MemberRole;
  /**
 * *
 * The name of the member

 */
  name: string;
  /**
 * *
 * The email of the member

 */
  email: string;
  /**
 * *
 * The bio of the member

 */
  bio?: string;
  /**
 * *
 * The photo of the member

 */
  photo?: string;
  /**
 * *
 * The phone of the member

 */
  phone?: string;
}

/**
 * @interface
 * The attributes to update in the member.
 * @property {string} id - The ID of the member
 * @property {MemberRole} role - The role of the member
 * @property {string} name - The name of the member
 * @property {string} email - The email of the member
 * @property {string} bio - The bio of the member
 * @property {string} photo - The photo of the member
 * @property {string} phone - The phone of the member
 */
export interface UpdateMemberDTO {
  /**
 * *
 * The ID of the member.

 */
  id: string;
  /**
 * *
 * The role of the member

 */
  role?: MemberRole;
  /**
 * *
 * The name of the member

 */
  name?: string;
  /**
 * *
 * The email of the member

 */
  email?: string;
  /**
 * *
 * The bio of the member

 */
  bio?: string;
  /**
 * *
 * The photo of the member

 */
  photo?: string;
  /**
 * *
 * The phone of the member

 */
  phone?: string;
}

/**
 * @interface
 * The member invite to be created.
 * @property {string} seller_id - The associated seller's ID.
 */
export interface CreateMemberInviteDTO
  extends Omit<
    MemberInviteDTO,
    "id" | "created_at" | "updated_at" | "accepted" | "expires_at" | "token"
  > {
  /**
 * *
 * The associated seller's ID.

 */
  seller_id: string;
}

/**
 * @interface
 * The accept member invite details.
 * @property {string} token - The token of the accept member invite
 * @property {string} name - The name of the accept member invite
 */
export interface AcceptMemberInviteDTO {
  /**
 * *
 * The token of the accept member invite

 */
  token: string;
  /**
 * *
 * The name of the accept member invite

 */
  name: string;
}

/**
 * @interface
 * The attributes to update in the member invite.
 * @property {string} id - The ID of the member invite
 */
export interface UpdateMemberInviteDTO extends Partial<MemberInviteDTO> {
  /**
 * *
 * The ID of the member invite.

 */
  id: string;
}

/**
 * @interface
 * The seller invitation to be created.
 * @property {string} email - The email of the seller invitation
 * @property {string} registration_url - The registration url of the seller invitation
 */
export interface CreateSellerInvitationDTO {
  /**
 * *
 * The email of the seller invitation

 */
  email: string;
  /**
 * *
 * The registration url of the seller invitation

 */
  registration_url: string;
}
