import { existsSync } from "fs"
import { join } from "path"

import type { MercurPatch, PatchTarget } from "../types"

const FIELDS_FILE = "dist/cart/utils/fields.js"
const OFFER_PROFILE_FIELD = "items.offer.shipping_profile_id"
const PRODUCT_PROFILE_FIELD = "items.variant.product.shipping_profile.id"

type FieldsModule = { cartFieldsForRefreshSteps?: unknown }

function loadFields(target: PatchTarget): string[] | null {
  if (!target.dir) return null

  const filePath = join(target.dir, FIELDS_FILE)
  if (!existsSync(filePath)) return null

  let mod: FieldsModule
  try {
    mod = require(filePath) as FieldsModule
  } catch {
    return null
  }

  const fields = mod.cartFieldsForRefreshSteps
  return Array.isArray(fields) ? (fields as string[]) : null
}

export const cartRefreshFieldsPatch: MercurPatch = {
  id: "core-flows/cart-refresh-fields",
  package: "@medusajs/core-flows",
  compatible: { from: "2.17.0", to: "2.19.0" },
  scope: "module",
  reason:
    "refreshCartItemsWorkflow refetches the cart with this field list and hands " +
    "it to refreshCartShippingMethodsWorkflow. Without the offer's profile on " +
    "each line, that workflow cannot tell which profile a seller actually ships " +
    "from.",

  detect(target) {
    const fields = loadFields(target)
    return !!fields?.includes(PRODUCT_PROFILE_FIELD)
  },

  isApplied(target) {
    const fields = loadFields(target)
    return !!fields?.includes(OFFER_PROFILE_FIELD)
  },

  apply(target) {
    // The array reference is captured when core composes the workflow and is
    // only deep-copied at run time, so appending here still reaches the step.
    loadFields(target)?.push(OFFER_PROFILE_FIELD)
  },
}
