/**
 * @schema VendorProduct
 * title: "Product"
 * description: "A product object with its properties"
 * required:
 *   - id
 *   - created_at
 *   - updated_at
 *   - title
 *   - handle
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the product.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was deleted.
 *     nullable: true
 *   title:
 *     type: string
 *     description: The title of the product.
 *   subtitle:
 *     type: string
 *     nullable: true
 *     description: The subtitle of the product.
 *   description:
 *     type: string
 *     nullable: true
 *     description: A description of the product.
 *   handle:
 *     type: string
 *     description: A unique handle for the product.
 *   is_giftcard:
 *     type: boolean
 *     description: Whether the product is a gift card.
 *   status:
 *     type: string
 *     enum: [draft, proposed, published, rejected]
 *     description: The status of the product.
 *   thumbnail:
 *     type: string
 *     nullable: true
 *     description: URL to the product's thumbnail.
 *   width:
 *     type: number
 *     nullable: true
 *     description: The width of the product.
 *   weight:
 *     type: number
 *     nullable: true
 *     description: The weight of the product.
 *   length:
 *     type: number
 *     nullable: true
 *     description: The length of the product.
 *   height:
 *     type: number
 *     nullable: true
 *     description: The height of the product.
 *   origin_country:
 *     type: string
 *     nullable: true
 *     description: The origin country of the product.
 *   hs_code:
 *     type: string
 *     nullable: true
 *     description: The HS Code of the product.
 *   mid_code:
 *     type: string
 *     nullable: true
 *     description: The MID Code of the product.
 *   material:
 *     type: string
 *     nullable: true
 *     description: The material of the product.
 *   collection:
 *     description: The associated product collection.
 *     $ref: "#/components/schemas/VendorProductCollection"
 *     nullable: true
 *   type:
 *     description: The associated product type.
 *     $ref: "#/components/schemas/VendorProductType"
 *     nullable: true
 *   tags:
 *     description: The associated product tags.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/VendorProductTag"
 *   categories:
 *     description: The associated product categories.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/VendorProductCategory"
 *   variants:
 *     description: The associated product variants.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/VendorProductVariant"
 *   options:
 *     description: The associated product options.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/VendorProductOption"
 *   images:
 *     description: The associated product images.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/VendorProductImage"
 *   discountable:
 *     type: boolean
 *     description: Whether the product can be discounted.
 *   external_id:
 *     type: string
 *     nullable: true
 *     description: The ID of the product in an external system.
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details.
 *     example: {car: "white"}
 *   rating:
 *     type: string
 *     nullable: true
 *     description: The average rating from customer reviews
 */

/**
 * @schema VendorProductVariant
 * title: "Product Variant"
 * description: "A product variant object with its properties"
 * required:
 *   - id
 *   - created_at
 *   - updated_at
 *   - title
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the product variant.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was deleted.
 *     nullable: true
 *   title:
 *     type: string
 *     description: The title of the product variant.
 *   sku:
 *     type: string
 *     nullable: true
 *     description: The SKU of the product variant.
 *   barcode:
 *     type: string
 *     nullable: true
 *     description: The barcode of the product variant.
 *   ean:
 *     type: string
 *     nullable: true
 *     description: The EAN of the product variant.
 *   upc:
 *     type: string
 *     nullable: true
 *     description: The UPC of the product variant.
 *   allow_backorder:
 *     type: boolean
 *     description: Whether the product variant can be ordered when it's out of stock.
 *   manage_inventory:
 *     type: boolean
 *     description: Whether the product variant's inventory should be managed by the core system.
 *   hs_code:
 *     type: string
 *     nullable: true
 *     description: The HS Code of the product variant.
 *   origin_country:
 *     type: string
 *     nullable: true
 *     description: The origin country of the product variant.
 *   mid_code:
 *     type: string
 *     nullable: true
 *     description: The MID Code of the product variant.
 *   material:
 *     type: string
 *     nullable: true
 *     description: The material of the product variant.
 *   weight:
 *     type: number
 *     nullable: true
 *     description: The weight of the product variant.
 *   length:
 *     type: number
 *     nullable: true
 *     description: The length of the product variant.
 *   height:
 *     type: number
 *     nullable: true
 *     description: The height of the product variant.
 *   width:
 *     type: number
 *     nullable: true
 *     description: The width of the product variant.
 *   options:
 *     description: The associated product option values.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/VendorProductOptionValue"
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details.
 *     example: {car: "white"}
 */

/**
 * @schema VendorProductImage
 * title: "Product Image"
 * description: "A product image object with its properties"
 * required:
 *   - id
 *   - created_at
 *   - updated_at
 *   - url
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the product image.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was deleted.
 *     nullable: true
 *   url:
 *     type: string
 *     description: The URL of the product image.
 *   rank:
 *     type: number
 *     description: The rank of the product image.
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details.
 *     example: {car: "white"}
 */

/**
 * @schema VendorProductOption
 * title: "Product Option"
 * description: "A product option object with its properties"
 * required:
 *   - id
 *   - created_at
 *   - updated_at
 *   - title
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the product option.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was deleted.
 *     nullable: true
 *   title:
 *     type: string
 *     description: The title of the product option.
 *   values:
 *     description: The associated product option values.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/VendorProductOptionValue"
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details.
 *     example: {car: "white"}
 */

/**
 * @schema VendorProductOptionValue
 * title: "Product Option Value"
 * description: "A product option value object with its properties"
 * required:
 *   - id
 *   - created_at
 *   - updated_at
 *   - value
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the product option value.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was deleted.
 *     nullable: true
 *   value:
 *     type: string
 *     description: The value of the product option value.
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details.
 *     example: {car: "white"}
 */

/**
 * @schema VendorProductTag
 * title: "Product Tag"
 * description: "A product tag object with its properties"
 * required:
 *   - id
 *   - value
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the product tag.
 *   value:
 *     type: string
 *     description: The value of the product tag.
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details.
 *     example: {car: "white"}
 */

/**
 * @schema VendorProductType
 * title: "Product Type"
 * description: "A product type object with its properties"
 * required:
 *   - id
 *   - value
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the product type.
 *   value:
 *     type: string
 *     description: The value of the product type.
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details.
 *     example: {car: "white"}
 */

/**
 * @schema VendorProductCollection
 * title: "Product Collection"
 * description: "A product collection object with its properties"
 * required:
 *   - id
 *   - created_at
 *   - updated_at
 *   - title
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the product collection.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was deleted.
 *     nullable: true
 *   title:
 *     type: string
 *     description: The title of the product collection.
 *   handle:
 *     type: string
 *     description: The handle of the product collection.
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details.
 *     example: {car: "white"}
 */

/**
 * @schema VendorProductCategory
 * title: "Product Category"
 * description: "A product category object with its properties"
 * required:
 *   - id
 *   - created_at
 *   - updated_at
 *   - name
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the product category.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was deleted.
 *     nullable: true
 *   name:
 *     type: string
 *     description: The name of the product category.
 *   handle:
 *     type: string
 *     description: The handle of the product category.
 *   is_active:
 *     type: boolean
 *     description: Whether the product category is active.
 *   is_internal:
 *     type: boolean
 *     description: Whether the product category is internal.
 *   rank:
 *     type: number
 *     description: The rank of the category among sibling categories.
 *   parent_category:
 *     description: The parent category.
 *     $ref: "#/components/schemas/VendorProductCategory"
 *     nullable: true
 *   category_children:
 *     description: The child categories.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/VendorProductCategory"
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details.
 *     example: {car: "white"}
 */
