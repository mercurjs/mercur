/**
 * @schema VendorPromotion
 * title: "Promotion"
 * description: "Promotion object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the item.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   code:
 *     type: string
 *     description: The code of the promotion.
 *   is_automatic:
 *     type: boolean
 *     description: Whether the promotion is applied automatically.
 *   type:
 *     type: string
 *     description: The type of the promotion.
 *   application_method:
 *     $ref: "#/components/schemas/VendorApplicationMethod"
 *   rules:
 *     type: array
 *     description: Promotion rules.
 *     items:
 *       $ref: "#/components/schemas/VendorPromotionRule"
 */

/**
 * @schema VendorApplicationMethod
 * title: "Promotion Application Method"
 * description: "Application method object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the item.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   description:
 *     type: string
 *     description: Description of the promotion.
 *   value:
 *     type: number
 *     description: The percentage value of the promotion.
 *   max_quantity:
 *     type: string
 *     description: The max quantity of the items.
 *   apply_to_quantity:
 *     type: string
 *     description: Apply to quantity of the items.
 *   buy_rules_min_quantity:
 *     type: string
 *     description: Buy ruyles min quantity of the items.
 *   type:
 *     type: string
 *     description: The type of the application method.
 *   target_type:
 *     type: string
 *     description: The target type of the application method.
 *   allocation:
 *     type: string
 *     description: The allocation of the application method.
 *   target_rules:
 *     type: array
 *     description: Promotion target rules.
 *     items:
 *       $ref: "#/components/schemas/VendorPromotionRule"
 */

/**
 * @schema VendorPromotionRule
 * type: object
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the item.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   description:
 *     type: string
 *     description: The description of the rule.
 *   attribute:
 *     type: string
 *     description: The attribute of the rule.
 *   operator:
 *     type: string
 *     description: The operator of the rule.
 *   values:
 *     type: array
 *     description: Rule values.
 *     items:
 *        type: object
 *        properties:
 *           value:
 *              type: string
 */

/**
 * @schema VendorRuleValueOption
 * type: object
 * properties:
 *   value:
 *     type: string
 *     title: value
 *     description: The rule value's value.
 *   label:
 *     type: string
 *     title: label
 *     description: The rule value's label.
 */

/**
 * @schema VendorRuleAttributeOption
 * type: object
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The rule attribute's ID, which is a rule's `attribute` it refers to.
 *   value:
 *     type: string
 *     title: value
 *     description: The rule value's value.
 *   label:
 *     type: string
 *     title: label
 *     description: The rule value's label.
 *   operators:
 *     type: array
 *     description: The attribute's operators.
 *   items:
 *     $ref: "#/components/schemas/VendorBaseRuleOperatorOptions"
 */

/**
 * @schema VendorBaseRuleOperatorOptions
 * type: object
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The operator's ID.
 *   value:
 *     type: string
 *     title: value
 *     description: The operator's value.
 *   label:
 *     type: string
 *     title: label
 *     description: The operator's label.
 */
