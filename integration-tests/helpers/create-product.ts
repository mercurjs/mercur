import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"

type ApiClient = {
  post: (
    path: string,
    body: Record<string, unknown>,
    headers: unknown
  ) => Promise<{ data: { product: VendorProduct } }>
}

/**
 * Master products are not auto-linked to their creating seller. Selling/visibility
 * eligibility lives on the `product_seller` restriction link, so tests that need a
 * product to be "assigned" to a seller (store visibility, category / sales-channel
 * ownership checks) must create that link explicitly.
 */
export const assignProductsToSeller = async (
  container: MedusaContainer,
  sellerId: string,
  productIds: string[]
): Promise<void> => {
  if (!productIds.length) {
    return
  }

  const link = container.resolve(ContainerRegistrationKeys.LINK)
  await link.create(
    productIds.map((product_id) => ({
      [Modules.PRODUCT]: { product_id },
      [MercurModules.SELLER]: { seller_id: sellerId },
    }))
  )
}

type VendorProduct = {
  id: string
  variants: { id: string; sku?: string }[]
  [key: string]: unknown
}

type VendorVariantInput = {
  title: string
  sku?: string
  /** Maps an axis attribute title to the variant's value, e.g. `{ Size: "M" }`. */
  options?: Record<string, string>
  [key: string]: unknown
}

type VendorAttributeInput =
  | { id: string; value_ids?: string[]; value?: string | number | boolean }
  | {
      title: string
      type?: "single_select" | "multi_select" | "text" | "toggle" | "unit"
      values?: string[]
      value?: string | number | boolean
      is_variant_axis?: boolean
      is_filterable?: boolean
      is_required?: boolean
      description?: string | null
      metadata?: Record<string, unknown> | null
    }

type CreateVendorProductOptions = {
  title: string
  status?: string
  /** SKU for the single default variant (ignored when `variants` is given). */
  sku?: string
  /** Title for the single default variant. Defaults to `"Default"`. */
  variantTitle?: string
  /** Override the generated variants array entirely. */
  variants?: VendorVariantInput[]
  /**
   * Unified product attributes. Pass a `multi_select` entry with
   * `is_variant_axis: true` to create a variant axis; each variant then
   * references it through its `options` map.
   */
  attributes?: VendorAttributeInput[]
  /** Extra top-level product fields merged into the request body. */
  extra?: Record<string, unknown>
}

/**
 * Creates a vendor product through `POST /vendor/products` using the current
 * request shape. The vendor flow derives the variant option from the unified
 * `attributes` field (an `is_variant_axis` entry) and otherwise auto-assigns a
 * default option, so a bare variant needs neither `options` nor
 * `variant_attributes`. Returns the created product (with `variants`).
 */
export const createVendorProduct = async (
  api: ApiClient,
  headers: unknown,
  opts: CreateVendorProductOptions
): Promise<VendorProduct> => {
  const variants = opts.variants ?? [
    { title: opts.variantTitle ?? "Default", sku: opts.sku },
  ]

  const body: Record<string, unknown> = {
    status: opts.status ?? "published",
    title: opts.title,
    variants,
    ...opts.extra,
  }

  if (opts.attributes) {
    body.attributes = opts.attributes
  }

  const { data } = await api.post(`/vendor/products`, body, headers)

  return data.product
}
