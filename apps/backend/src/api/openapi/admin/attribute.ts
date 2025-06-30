/**
 * @schema AttributePossibleValue
 * title: "AttributePossibleValue"
 * description: "Attribute possible value object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the possible value.
 *   value:
 *     type: string
 *     description: The value of the possible value.
 *   rank:
 *     type: number
 *     description: The rank/order of the possible value.
 *   metadata:
 *     type: object
 *     description: Additional metadata for the possible value.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 */

/**
 * @schema AttributeValue
 * title: "AttributeValue"
 * description: "Attribute value object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the attribute value.
 *   value:
 *     type: string
 *     description: The value of the attribute.
 */

/**
 * @schema ProductCategory
 * title: "ProductCategory"
 * description: "Product category object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the product category.
 *   name:
 *     type: string
 *     description: The name of the product category.
 */

/**
 * @schema Attribute
 * title: "Attribute"
 * description: "Attribute object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the attribute.
 *   name:
 *     type: string
 *     description: The name of the attribute.
 *   description:
 *     type: string
 *     description: A description of the attribute.
 *   handle:
 *     type: string
 *     description: A unique handle for the attribute.
 *   is_filterable:
 *     type: boolean
 *     description: Whether the attribute can be used for filtering products.
 *   ui_component:
 *     type: string
 *     enum: [select, multivalue, unit, toggle, text_area, color_picker]
 *     description: The UI component type for this attribute.
 *   metadata:
 *     type: object
 *     description: Additional metadata for the attribute.
 *   possible_values:
 *     type: array
 *     description: Array of possible values for the attribute.
 *     items:
 *       $ref: '#/components/schemas/AttributePossibleValue'
 *   values:
 *     type: array
 *     description: Array of attribute values.
 *     items:
 *       $ref: '#/components/schemas/AttributeValue'
 *   product_categories:
 *     type: array
 *     description: Array of product categories associated with this attribute.
 *     items:
 *       $ref: '#/components/schemas/ProductCategory'
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
 *     nullable: true
 *     description: The date with timezone at which the resource was deleted.
 */
