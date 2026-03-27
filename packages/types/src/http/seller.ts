import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import { SellerDTO, SellerMemberDTO } from "../seller"

export interface VendorSellerResponse {
  /**
   * The seller's details.
   */
  seller: SellerDTO
}

export type VendorSellerListResponse = PaginatedResponse<{
  /**
   * The list of sellers.
   */
  sellers: SellerDTO[]
}>

export interface VendorSellerMemberResponse {
  /**
   * The seller member's details.
   */
  seller_member: SellerMemberDTO
}

export type VendorSellerMemberListResponse = PaginatedResponse<{
  /**
   * The list of seller members.
   */
  seller_members: SellerMemberDTO[]
}>

export type VendorSellerDeleteResponse = DeleteResponse<"seller">

export interface StoreSellerResponse {
  /**
   * The seller's details.
   */
  seller: SellerDTO
}

export type StoreSellerListResponse = PaginatedResponse<{
  /**
   * The list of sellers.
   */
  sellers: SellerDTO[]
}>

export interface AdminSellerResponse {
  seller: SellerDTO
}

export type AdminSellerListResponse = PaginatedResponse<{
  sellers: SellerDTO[]
}>
