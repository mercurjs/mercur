import { WrappedProductAttributeDTO } from "../product/common"

/**
 * The store product routes enrich Medusa's `StoreProduct` after the graph
 * read: `enrichProductAttributes` attaches the flattened `attributes` array
 * and `wrapProductVariantsWithOfferPrice` stamps the cheapest offer's
 * `offer_id` on each variant. Neither field exists on the upstream types, so
 * they are merged in here — Medusa's own `StoreProductResponse` /
 * `StoreProductListResponse` then carry them without a wrapper type.
 *
 * This file is loaded for every `@mercurjs/types` consumer via a side-effect
 * `import "./augmentations"` in `http/index.ts`; the augmentation only takes
 * effect while its declaration is part of the compilation.
 */
declare module "@medusajs/types" {
  interface StoreProductVariant {
    offer_id?: string | null
  }

  interface StoreProduct {
    attributes?: WrappedProductAttributeDTO[]
  }
}

export {}
