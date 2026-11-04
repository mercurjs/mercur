import { HttpTypes } from "@mercurjs/types"

export const INBOX_TYPES = [
  "new_product",
  "update",
  "delete",
] as const satisfies HttpTypes.AdminProductChangeInboxType[]

export const INBOX_TYPE_COLORS: Record<
  HttpTypes.AdminProductChangeInboxType,
  "blue" | "orange" | "red"
> = {
  new_product: "blue",
  update: "orange",
  delete: "red",
}
