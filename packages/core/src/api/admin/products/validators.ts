import { z } from "zod"
import { ProductStatus } from "@mercurjs/types"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "@medusajs/medusa/api/utils/validators"
import {
  applyAndAndOrOperators,
  booleanString,
} from "@medusajs/medusa/api/utils/common-validators/common"
import { AdditionalData, OperatorMap } from "@medusajs/framework/types"
import { isPresent } from "@medusajs/framework/utils"

const statusEnum = z.nativeEnum(ProductStatus)

// --- List / retrieve query params ---

const AdminGetProductsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.string().optional(),
  handle: z.string().optional(),
  seller_id: z.union([z.string(), z.array(z.string())]).optional(),
  status: statusEnum.array().optional(),
  collection_id: z.union([z.string(), z.array(z.string())]).optional(),
  type_id: z.union([z.string(), z.array(z.string())]).optional(),
  category_id: z.union([z.string(), z.array(z.string())]).optional(),
  tag_id: z.union([z.string(), z.array(z.string())]).optional(),
  sku: z.string().optional(),
  ean: z.string().optional(),
  upc: z.string().optional(),
  barcode: z.string().optional(),
  // Offers-list pseudo-filter: scope products to those carrying at least
  // one offer. Consumed (and removed) by `applyOfferedProductsFilter`
  // before the product graph read. When paired with `seller_id` on the
  // Offers surface, the seller scope is reinterpreted as the offer's store.
  has_offer: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
})

export type AdminGetProductsParamsType = z.infer<typeof AdminGetProductsParams>
export const AdminGetProductsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(AdminGetProductsParamsFields)
  .merge(applyAndAndOrOperators(AdminGetProductsParamsFields))
  .transform((data) => {
    const res = { ...data } as Record<string, unknown>

    if (isPresent(data.tag_id)) {
      res.tags = { id: data.tag_id as string[] }
      delete res.tag_id
    }

    if (isPresent(data.category_id)) {
      res.categories = { id: data.category_id as OperatorMap<string> }
      delete res.category_id
    }

    return res
  })

export type AdminGetProductParamsType = z.infer<typeof AdminGetProductParams>
export const AdminGetProductParams = createSelectParams()

// --- Create / update product ---

const IdAssociation = z.object({ id: z.string() })

const CreateProductVariant = z
  .object({
    title: z.string(),
    sku: z.string().nullish(),
    ean: z.string().nullish(),
    upc: z.string().nullish(),
    isbn: z.string().nullish(),
    asin: z.string().nullish(),
    gtin: z.string().nullish(),
    barcode: z.string().nullish(),
    hs_code: z.string().nullish(),
    mid_code: z.string().nullish(),
    variant_rank: z.number().optional(),
    weight: z.number().nullish(),
    length: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    origin_country: z.string().nullish(),
    material: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
    /** Stock Medusa: maps option title -> chosen value name (e.g. `{ Color: "Blue" }`). */
    options: z.record(z.string()).optional(),
    // See CreateProductVariantDTO.attribute_values — resolved by the service.
    attribute_values: z
      .record(z.union([z.string(), z.array(z.string())]))
      .optional(),
  })
  .strict()

const UpdateProductVariant = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    sku: z.string().nullish(),
    ean: z.string().nullish(),
    upc: z.string().nullish(),
    isbn: z.string().nullish(),
    asin: z.string().nullish(),
    gtin: z.string().nullish(),
    barcode: z.string().nullish(),
    hs_code: z.string().nullish(),
    mid_code: z.string().nullish(),
    thumbnail: z.string().nullish(),
    variant_rank: z.number().optional(),
    weight: z.number().nullish(),
    length: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    origin_country: z.string().nullish(),
    material: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
    prices: z
      .array(
        z.object({
          id: z.string().optional(),
          currency_code: z.string().optional(),
          amount: z.number().optional(),
          min_quantity: z.number().nullish(),
          max_quantity: z.number().nullish(),
          rules: z.record(z.string(), z.string()).optional(),
        })
      )
      .optional(),
    options: z.record(z.string()).optional(),
    attribute_values: z
      .record(z.union([z.string(), z.array(z.string())]))
      .optional(),
  })
  .strict()

// --- Attribute input validators ---

const AttributeTypeEnum = z.enum([
  "single_select",
  "multi_select",
  "text",
  "toggle",
  "unit",
])

/**
 * UI-facing attribute reference. Two shapes:
 *
 *   1. **Existing reference** — `{ attribute_id, value_ids?, values? }`.
 *      `attribute_id` points at a pre-created ProductAttribute (global, or
 *      scoped to this product on a prior round-trip). Use `value_ids` for
 *      known ProductAttributeValue ids; or `values` (names) to upsert
 *      values on the attribute (only meaningful for text/unit/toggle).
 *
 *   2. **Inline custom** — `{ name, type, values, is_variant_axis? }`.
 *      Creates a new ProductAttribute scoped to the product being mutated.
 *      The wrapper persists it, links the chosen values, and (for variant
 *      axes) synthesizes the matching stock `options` entry.
 *
 * Discriminator: presence of `attribute_id` vs `name`.
 */
const ProductAttributeInput = z.union([
  z
    .object({
      attribute_id: z.string(),
      value_ids: z.array(z.string()).optional(),
      values: z.array(z.string()).optional(),
    })
    .strict(),
  z
    .object({
      name: z.string().min(1),
      type: AttributeTypeEnum,
      values: z.array(z.string()).optional(),
      is_variant_axis: z.boolean().optional(),
      is_filterable: z.boolean().optional(),
      is_required: z.boolean().optional(),
      description: z.string().nullish(),
      metadata: z.record(z.unknown()).nullish(),
    })
    .strict(),
])

// --- Variant query params ---

export type AdminGetProductVariantParamsType = z.infer<
  typeof AdminGetProductVariantParams
>
export const AdminGetProductVariantParams = createSelectParams()

const AdminGetProductVariantsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  sku: z.string().optional(),
  ean: z.string().optional(),
  upc: z.string().optional(),
  barcode: z.string().optional(),
})

export type AdminGetProductVariantsParamsType = z.infer<
  typeof AdminGetProductVariantsParams
>
export const AdminGetProductVariantsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(AdminGetProductVariantsParamsFields)
  .merge(applyAndAndOrOperators(AdminGetProductVariantsParamsFields))

// --- Variant create / update ---

export type AdminCreateProductVariantType = z.infer<
  typeof CreateProductVariant
> &
  AdditionalData
export const AdminCreateProductVariant =
  WithAdditionalData(CreateProductVariant)

export type AdminUpdateProductVariantType = z.infer<
  typeof UpdateProductVariant
> &
  AdditionalData
export const AdminUpdateProductVariant =
  WithAdditionalData(UpdateProductVariant)

// --- Product create / update ---

export type AdminCreateProductType = z.infer<typeof CreateProduct> &
  AdditionalData
const CreateProduct = z
  .object({
    title: z.string(),
    subtitle: z.string().nullish(),
    description: z.string().nullish(),
    is_giftcard: booleanString().optional().default(false),
    discountable: booleanString().optional().default(true),
    images: z.array(z.object({ url: z.string() })).optional(),
    thumbnail: z.string().nullish(),
    handle: z.string().optional(),
    status: statusEnum.optional(),
    external_id: z.string().nullish(),
    type_id: z.string().nullish(),
    collection_id: z.string().nullish(),
    seller_ids: z.array(z.string()).optional(),
    categories: z.array(IdAssociation).optional(),
    tags: z.array(IdAssociation).optional(),
    /** Stock Medusa product options: drives variant generation. */
    options: z
      .array(z.object({ title: z.string(), values: z.array(z.string()) }))
      .optional(),
    variant_attributes: z.array(ProductAttributeInput).optional(),
    product_attributes: z.array(ProductAttributeInput).optional(),
    attribute_values: z
      .record(z.union([z.string(), z.array(z.string())]))
      .optional(),
    variants: z.array(CreateProductVariant).optional(),
    weight: z.number().nullish(),
    length: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    hs_code: z.string().nullish(),
    mid_code: z.string().nullish(),
    origin_country: z.string().nullish(),
    material: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
  })
  .strict()
export const AdminCreateProduct = WithAdditionalData(CreateProduct)

export type AdminUpdateProductType = z.infer<typeof UpdateProduct> &
  AdditionalData
export const UpdateProduct = z
  .object({
    title: z.string().optional(),
    subtitle: z.string().nullish(),
    description: z.string().nullish(),
    discountable: booleanString().optional(),
    is_giftcard: booleanString().optional(),
    images: z
      .array(z.object({ id: z.string().optional(), url: z.string() }))
      .optional(),
    thumbnail: z.string().nullish(),
    handle: z.string().nullish(),
    status: statusEnum.optional(),
    external_id: z.string().nullish(),
    type_id: z.string().nullish(),
    collection_id: z.string().nullish(),
    categories: z.array(IdAssociation).optional(),
    tags: z.array(IdAssociation).optional(),
    options: z
      .array(z.object({ title: z.string(), values: z.array(z.string()) }))
      .optional(),
    variant_attributes: z.array(ProductAttributeInput).optional(),
    product_attributes: z.array(ProductAttributeInput).optional(),
    attribute_values: z
      .record(z.union([z.string(), z.array(z.string())]))
      .optional(),
    variants: z.array(UpdateProductVariant).optional(),
    weight: z.number().nullish(),
    length: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    hs_code: z.string().nullish(),
    mid_code: z.string().nullish(),
    origin_country: z.string().nullish(),
    material: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
  })
  .strict()
export const AdminUpdateProduct = WithAdditionalData(UpdateProduct)

// --- Action endpoints ---

export type AdminConfirmProductType = z.infer<typeof AdminConfirmProduct>
export const AdminConfirmProduct = z
  .object({
    internal_note: z.string().optional(),
  })
  .strict()

export type AdminRejectProductType = z.infer<typeof AdminRejectProduct>
export const AdminRejectProduct = z.object({
  message: z.string().optional(),
})

export type AdminRequestProductChangesType = z.infer<
  typeof AdminRequestProductChanges
>
export const AdminRequestProductChanges = z.object({
  message: z.string().optional(),
})

// --- Batch product variants ---

const BatchVariantCreateItem = CreateProductVariant
const BatchVariantUpdateItem = UpdateProductVariant.extend({
  id: z.string(),
})

const BatchProductVariants = z.object({
  create: z.array(BatchVariantCreateItem).optional(),
  update: z.array(BatchVariantUpdateItem).optional(),
  delete: z.array(z.string()).optional(),
})

export type AdminBatchProductVariantsType = z.infer<typeof BatchProductVariants>
export const AdminBatchProductVariants = BatchProductVariants

// --- Batch variant ↔ inventory-item links ---

const BatchVariantInventoryCreate = z
  .object({
    variant_id: z.string(),
    inventory_item_id: z.string(),
    required_quantity: z.number().nonnegative().optional(),
  })
  .strict()

const BatchVariantInventoryUpdate = BatchVariantInventoryCreate

const BatchVariantInventoryDelete = z
  .object({
    variant_id: z.string(),
    inventory_item_id: z.string(),
  })
  .strict()

const BatchVariantInventoryItems = z.object({
  create: z.array(BatchVariantInventoryCreate).optional(),
  update: z.array(BatchVariantInventoryUpdate).optional(),
  delete: z.array(BatchVariantInventoryDelete).optional(),
})

export type AdminBatchVariantInventoryItemsType = z.infer<
  typeof AdminBatchVariantInventoryItems
>
export const AdminBatchVariantInventoryItems = BatchVariantInventoryItems

// --- Batch products ---

const BatchProductsUpdateItem = UpdateProduct.extend({
  id: z.string(),
})

const BatchProducts = z.object({
  update: z.array(BatchProductsUpdateItem).optional(),
  delete: z.array(z.string()).optional(),
})

export type AdminBatchProductsType = z.infer<typeof BatchProducts> &
  AdditionalData
export const AdminBatchProducts = WithAdditionalData(BatchProducts)

// --- Batch product attributes ---

const BatchProductAttributeCreate = z.union([
  // Select types — reference existing value IDs
  z.object({
    attribute_id: z.string(),
    attribute_value_ids: z.array(z.string()).optional(),
  }).strict(),
  // Text/unit/toggle types — provide new value strings
  z.object({
    attribute_id: z.string(),
    values: z.array(z.string()),
  }).strict(),
])

export type AdminBatchProductAttributesType = z.infer<
  typeof AdminBatchProductAttributes
>
export const AdminBatchProductAttributes = z.object({
  create: z.array(BatchProductAttributeCreate).optional(),
  delete: z.array(z.string()).optional(),
})

// --- Attach single product attribute ---
//
// Mirror of `VendorAddProductAttribute` for the admin surface. Used by
// `POST /admin/products/:id/attributes`. Two shapes share a single
// flat body (the middleware-friendly form); the route branches on the
// presence of `attribute_id` vs `name`:
//
//   1. **Attach existing** — `{ attribute_id, attribute_value_ids? | values? }`.
//      `attribute_value_ids` for select types; `values` (names) for
//      text/unit/toggle types where the value is upserted by name.
//
//   2. **Inline create** — `{ name, type, values?, is_variant_axis?, ... }`.
//      Creates a product-scoped `ProductAttribute` (hidden from the
//      global `/admin/product-attributes` catalogue), materialises its
//      values, and links them to the product. Mirrors the inline shape
//      accepted inside the product create payload's `product_attributes`
//      / `variant_attributes` arrays.

export type AdminAddProductAttributeType = z.infer<
  typeof AdminAddProductAttribute
>
export const AdminAddProductAttribute = z
  .object({
    attribute_id: z.string().optional(),
    attribute_value_ids: z.array(z.string()).optional(),
    name: z.string().min(1).optional(),
    type: AttributeTypeEnum.optional(),
    is_variant_axis: z.boolean().optional(),
    is_filterable: z.boolean().optional(),
    is_required: z.boolean().optional(),
    description: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
    values: z.array(z.string()).optional(),
  })
  .strict()
  .refine(
    (data) => Boolean(data.attribute_id) !== Boolean(data.name),
    {
      message:
        "Provide either `attribute_id` (attach existing) or `name` (inline create), not both.",
    },
  )
  .refine((data) => !data.name || !!data.type, {
    message: "Inline-create branch requires `type`.",
    path: ["type"],
  })
  .refine(
    (data) => !data.attribute_id || data.type === undefined,
    {
      message: "`type` is only valid with the inline-create branch.",
      path: ["type"],
    },
  )

/**
 * `POST /admin/products/:id/attributes/:attribute_id` — atomic value-set
 * replacement for an attribute on a product. Admin goes direct against
 * `detachProductAttributeWorkflow` + `addProductAttributeWorkflow`
 * (no staging — operators don't go through the ProductChange flow that
 * sellers do), so the route handler chains both calls.
 */
export type AdminUpdateProductAttributeType = z.infer<
  typeof AdminUpdateProductAttribute
>
export const AdminUpdateProductAttribute = z
  .object({
    attribute_value_ids: z.array(z.string()).optional(),
    values: z.array(z.string()).optional(),
  })
  .strict()
