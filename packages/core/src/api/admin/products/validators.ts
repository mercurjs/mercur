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
export const AdminGetProductParams = createSelectParams().merge(
  z.object({
    seller_id: z.string().optional(),
  })
)

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
    options: z.record(z.string()).optional(),
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
  })
  .strict()

const AttributeTypeEnum = z.enum([
  "single_select",
  "multi_select",
  "text",
  "toggle",
  "unit",
])

const AttributeScalar = z.union([z.string(), z.number(), z.boolean()])
const UnifiedProductAttributeInput = z.union([
  z
    .object({
      id: z.string(),
      value_ids: z.array(z.string()).optional(),
      value: AttributeScalar.optional(),
    })
    .strict(),
  z
    .object({
      title: z.string().min(1),
      type: AttributeTypeEnum.optional(),
      values: z.array(z.string()).optional(),
      value: AttributeScalar.optional(),
      is_variant_axis: z.boolean().optional(),
      is_filterable: z.boolean().optional(),
      is_required: z.boolean().optional(),
      description: z.string().nullish(),
      metadata: z.record(z.unknown()).nullish(),
    })
    .strict(),
])

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
    options: z
      .array(z.object({ title: z.string(), values: z.array(z.string()) }))
      .optional(),
    attributes: z.array(UnifiedProductAttributeInput).optional(),
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

const ConfirmProduct = z
  .object({
    internal_note: z.string().optional(),
  })
  .strict()
export type AdminConfirmProductType = z.infer<typeof ConfirmProduct> &
  AdditionalData
export const AdminConfirmProduct = WithAdditionalData(ConfirmProduct)

const RejectProduct = z.object({
  message: z.string().optional(),
})
export type AdminRejectProductType = z.infer<typeof RejectProduct> &
  AdditionalData
export const AdminRejectProduct = WithAdditionalData(RejectProduct)

const RequestProductChanges = z.object({
  message: z.string().optional(),
})
export type AdminRequestProductChangesType = z.infer<
  typeof RequestProductChanges
> &
  AdditionalData
export const AdminRequestProductChanges = WithAdditionalData(
  RequestProductChanges
)

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

const BatchAttributeScalar = z.union([z.string(), z.number(), z.boolean()])
const BatchAttributeAdd = z.union([
  z
    .object({
      id: z.string(),
      value_ids: z.array(z.string()).optional(),
      value: BatchAttributeScalar.optional(),
    })
    .strict(),
  z
    .object({
      title: z.string().min(1),
      type: AttributeTypeEnum.optional(),
      values: z.array(z.string()).optional(),
      value: BatchAttributeScalar.optional(),
      is_variant_axis: z.boolean().optional(),
      is_filterable: z.boolean().optional(),
      is_required: z.boolean().optional(),
      description: z.string().nullish(),
      metadata: z.record(z.unknown()).nullish(),
    })
    .strict()
    .refine((v) => !v.is_variant_axis || (v.type ?? "multi_select") === "multi_select", {
      message: "is_variant_axis is only allowed on multi_select attributes",
      path: ["is_variant_axis"],
    })
    .refine(
      (v) =>
        v.is_variant_axis ||
        v.type !== undefined ||
        typeof v.value === "boolean",
      {
        message: "inline non-axis attributes require an explicit type",
        path: ["type"],
      },
    ),
])
const BatchAttributeUpdate = z
  .object({
    id: z.string(),
    title: z.string().optional(),
    add: z
      .array(z.union([z.string(), z.object({ value: z.string() }).strict()]))
      .optional(),
    remove: z.array(z.string()).optional(),
    value: BatchAttributeScalar.optional(),
  })
  .strict()

const BatchProductAttributes = z.object({
  add: z.array(BatchAttributeAdd).optional(),
  remove: z.array(z.string()).optional(),
  update: z.array(BatchAttributeUpdate).optional(),
})
export type AdminBatchProductAttributesType = z.infer<
  typeof BatchProductAttributes
> &
  AdditionalData
export const AdminBatchProductAttributes =
  WithAdditionalData(BatchProductAttributes)
