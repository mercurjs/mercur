import { Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

const listeners = (module: string, entity: string) =>
  `@Listeners(values: [${["created", "updated", "deleted", "restored"]
    .map((action) => `"${module}.${entity}.${action}"`)
    .join(", ")}])`

// The index module replaces its default schema with the `schema` option, so the
// Medusa product types are repeated here (@medusajs/index keeps them private)
// with the Mercur entities added. Offer -> Seller and Offer -> Product resolve
// through the `offer_seller` / `offer_product` link tables.
//
// Every relation here must resolve through one link table whose foreign key
// points at the related type itself. When it does not (Medusa's own
// `ProductVariant.prices: [Price]` reaches Price through PriceSet), the index
// searches every module schema for a path and, with the `offer_price` link
// giving Price an `offer` field, it wandered Offer -> Seller -> Review ->
// Product -> ProductVariant -> PriceSet and broke the Product sync.
export const mercurIndexSchema = `
  type Product ${listeners(Modules.PRODUCT, "product")} {
    id: ID
    title: String
    handle: String
    status: String
    type_id: String
    collection_id: String
    is_giftcard: Boolean
    external_id: String
    created_at: DateTime
    updated_at: DateTime

    variants: [ProductVariant]
    sales_channels: [SalesChannel]
  }

  type ProductVariant ${listeners(Modules.PRODUCT, "product-variant")} {
    id: ID
    product_id: String
    sku: String
  }

  type SalesChannel ${listeners(Modules.SALES_CHANNEL, "sales-channel")} {
    id: ID
    is_disabled: Boolean
  }

  type Offer ${listeners(MercurModules.OFFER, "offer")} {
    id: ID
    seller_id: String
    product_id: String
    variant_id: String
    sku: String
    condition_id: String
    created_at: DateTime
    updated_at: DateTime

    seller: Seller
    product: Product
  }

  type Seller ${listeners(MercurModules.SELLER, "seller")} {
    id: ID
    status: String
    closed_from: DateTime
    closed_to: DateTime
  }
`
