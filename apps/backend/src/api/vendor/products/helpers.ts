import { ProductDTO } from '@medusajs/framework/types'

export const remapProductFieldsToSellerProduct = (fields: string[]) => {
  return fields.map((field) => `product.${field}`)
}

export const remapSellerProductQuery = (data: { product: ProductDTO }[]) =>
  data.map((it) => it.product)
