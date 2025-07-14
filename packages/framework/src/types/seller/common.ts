/**
 * @enum
 * Store status enumeration for sellers.
 */
export enum StoreStatus {
  /**
   * Active store status.
   * @value "ACTIVE"
   */
  ACTIVE = "ACTIVE",
  /**
   * Inactive store status.
   * @value "INACTIVE"
   */
  INACTIVE = "INACTIVE",
  /**
   * Suspended store status.
   * @value "SUSPENDED"
   */
  SUSPENDED = "SUSPENDED",
}

/**
 * The seller details.
 * @interface
 * @property {string} id - The ID of the seller.
 * @property {StoreStatus} store_status - The store status of the seller
 * @property {Date} created_at - The creation date.
 * @property {Date} updated_at - The last update date.
 * @property {string} name - The name of the seller
 * @property {string|null} email - The email of the seller
 * @property {string|null} phone - The phone of the seller
 * @property {string|null} description - The description of the seller
 * @property {string|null} address_line - The address line of the seller
 * @property {string|null} city - The city of the seller
 * @property {string|null} state - The state of the seller
 * @property {string|null} postal_code - The postal code of the seller
 * @property {string|null} country_code - The country code of the seller
 * @property {string|null} tax_id - The associated tax's ID.
 * @property {string} handle - The handle of the seller
 * @property {string|null} photo - The photo of the seller
 * @property {Partial<MemberDTO>[]} [members] - The members of the seller
 */
export type SellerDTO = {
  /**
   * The ID of the seller.
   */
  id: string;
  /**
   * The store status of the seller
   */
  store_status: StoreStatus;
  /**
   * The creation date.
   */
  created_at: Date;
  /**
   * The last update date.
   */
  updated_at: Date;
  /**
   * The name of the seller
   */
  name: string;
  /**
   * The email of the seller
   */
  email: string | null;
  /**
   * The phone of the seller
   */
  phone: string | null;
  /**
   * The description of the seller
   */
  description: string | null;
  /**
   * The address line of the seller
   */
  address_line: string | null;
  /**
   * The city of the seller
   */
  city: string | null;
  /**
   * The state of the seller
   */
  state: string | null;
  /**
   * The postal code of the seller
   */
  postal_code: string | null;
  /**
   * The country code of the seller
   */
  country_code: string | null;
  /**
   * The associated tax's ID.
   */
  tax_id: string | null;
  /**
   * The handle of the seller
   */
  handle: string;
  /**
   * The photo of the seller
   */
  photo: string | null;
  /**
   * The members of the seller
   */
  members?: Partial<MemberDTO>[];
};

/**
 * The seller with payout account details.
 * @interface
 * @property {string} id - The ID of the seller.
 * @property {StoreStatus} store_status - The store status of the seller
 * @property {Date} created_at - The creation date.
 * @property {Date} updated_at - The last update date.
 * @property {string} name - The name of the seller
 * @property {string|null} email - The email of the seller
 * @property {string|null} phone - The phone of the seller
 * @property {string|null} description - The description of the seller
 * @property {string|null} address_line - The address line of the seller
 * @property {string|null} city - The city of the seller
 * @property {string|null} state - The state of the seller
 * @property {string|null} postal_code - The postal code of the seller
 * @property {string|null} country_code - The country code of the seller
 * @property {string|null} tax_id - The associated tax's ID.
 * @property {string} handle - The handle of the seller
 * @property {string|null} photo - The photo of the seller
 * @property {Partial<MemberDTO>[]} [members] - The members of the seller
 * @property {Object} payout_account - The payout account details
 * @property {string} payout_account.id - The ID of the payout account
 * @property {Date} payout_account.created_at - The creation date of the payout account
 * @property {Date} payout_account.updated_at - The last update date of the payout account
 * @property {string} payout_account.reference_id - The reference ID of the payout account
 * @property {Record<string, unknown>} payout_account.data - The data of the payout account
 * @property {string} payout_account.status - The status of the payout account
 */
export type SellerWithPayoutAccountDTO = SellerDTO & {
  /**
   * The payout account details.
   */
  payout_account: {
    /**
     * The ID of the payout account.
     */
    id: string;
    /**
     * The creation date of the payout account.
     */
    created_at: Date;
    /**
     * The last update date of the payout account.
     */
    updated_at: Date;
    /**
     * The reference ID of the payout account.
     */
    reference_id: string;
    /**
     * The data of the payout account.
     */
    data: Record<string, unknown>;
    /**
     * The status of the payout account.
     */
    status: string;
  };
};

/**
 * Member role enumeration.
 * @enum
 */
export enum MemberRole {
  /**
   * Owner role.
   * @value "owner"
   */
  OWNER = "owner",
  /**
   * Admin role.
   * @value "admin"
   */
  ADMIN = "admin",
  /**
   * Member role.
   * @value "member"
   */
  MEMBER = "member",
}

/**
 * The member details.
 * @interface
 * @property {string} id - The ID of the member.
 * @property {Date} created_at - The creation date.
 * @property {Date} updated_at - The last update date.
 * @property {MemberRole} role - The role of the member
 * @property {string|null} email - The email of the member
 * @property {string|null} name - The name of the member
 * @property {string|null} bio - The bio of the member
 * @property {string|null} photo - The photo of the member
 * @property {string|null} phone - The phone of the member
 * @property {Partial<SellerDTO>} [seller] - The seller of the member
 */
export type MemberDTO = {
  /**
   * The ID of the member.
   */
  id: string;
  /**
   * The creation date.
   */
  created_at: Date;
  /**
   * The last update date.
   */
  updated_at: Date;
  /**
   * The role of the member
   */
  role: MemberRole;
  /**
   * The email of the member
   */
  email: string | null;
  /**
   * The name of the member
   */
  name: string | null;
  /**
   * The bio of the member
   */
  bio: string | null;
  /**
   * The photo of the member
   */
  photo: string | null;
  /**
   * The phone of the member
   */
  phone: string | null;
  /**
   * The seller of the member
   */
  seller?: Partial<SellerDTO>;
};

/**
 * The member invite details.
 * @interface
 * @property {string} id - The ID of the member invite.
 * @property {Date} created_at - The creation date.
 * @property {Date} updated_at - The last update date.
 * @property {string} email - The email of the member invite
 * @property {MemberRole} role - The role of the member invite
 * @property {Partial<SellerDTO>} [seller] - The seller of the member invite
 * @property {string} token - The token of the member invite
 * @property {Date} expires_at - The expiration date.
 * @property {boolean} accepted - Whether the member invite has been accepted.
 */
export type MemberInviteDTO = {
  /**
   * The ID of the member invite.
   */
  id: string;
  /**
   * The creation date.
   */
  created_at: Date;
  /**
   * The last update date.
   */
  updated_at: Date;
  /**
   * The email of the member invite
   */
  email: string;
  /**
   * The role of the member invite
   */
  role: MemberRole;
  /**
   * The seller of the member invite
   */
  seller?: Partial<SellerDTO>;
  /**
   * The token of the member invite
   */
  token: string;
  /**
   * The expiration date.
   */
  expires_at: Date;
  /**
   * Whether the member invite has been accepted.
   */
  accepted: boolean;
};
