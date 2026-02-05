import { HttpTypes } from "@medusajs/types"

export const LOYALTY_PLUGIN_NAME = "@medusajs/loyalty-plugin"

export const getLoyaltyPlugin = (plugins: HttpTypes.AdminPlugin[]) => {
  return plugins?.find((plugin) => plugin.name === LOYALTY_PLUGIN_NAME)
}
