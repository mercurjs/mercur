import { InferTypeOf } from "@medusajs/framework/types"
import { Seller } from "../models"

export enum SellerStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
}

export type SellerDTO = InferTypeOf<typeof Seller>
