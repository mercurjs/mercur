import { HttpTypes } from "@mercurjs/types"

export const REQUEST_TYPES = [
  "new_product",
  "update",
  "delete",
] as const satisfies HttpTypes.AdminProductChangeRequestType[]

export const REQUEST_TYPE_COLORS: Record<
  HttpTypes.AdminProductChangeRequestType,
  "blue" | "orange" | "red"
> = {
  new_product: "blue",
  update: "orange",
  delete: "red",
}
