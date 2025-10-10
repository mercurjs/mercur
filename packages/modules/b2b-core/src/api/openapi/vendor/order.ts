/**
 * @schema VendorOrderCommissionValue
 * type: object
 * properties:
 *   amount:
 *     type: number
 *     title: amount
 *     description: Total commission value of the order
 *   currency_code:
 *     type: string
 *     title: currency_code
 *     description: The order's currency code.
 */

/**
 * @schema VendorOrderCommissionLine
 * type: object
 * properties:
 *   id:
 *     type: string
 *     description: Commission line id
 *   item_line_id:
 *     type: string
 *     description: Order line item id that commission line relates to
 *   amount:
 *     type: number
 *     title: amount
 *     description: Commission value of the order line
 *   currency_code:
 *     type: string
 *     title: currency_code
 *     description: The currency code.
 */

/**
 * @schema VendorSplitOrderPayment
 * type: object
 * properties:
 *   id:
 *     type: string
 *     description: Split order payment id
 *   status:
 *     type: string
 *     description: Payment status
 *   authorized_amount:
 *     type: number
 *     title: amount
 *     description: Authorized amount
 *   captured_amount:
 *     type: number
 *     title: amount
 *     description: Captured amount
 *   refunded_amount:
 *     type: number
 *     title: amount
 *     description: Refunded amount
 *   currency_code:
 *     type: string
 *     title: currency_code
 *     description: The currency code.
 */

/**
 * @schema VendorOrderDetails
 * type: object
 * description: The order's details.
 * properties:
 *   split_order_payment:
 *     $ref: '#/components/schemas/VendorSplitOrderPayment'
 *   fulfillments:
 *     type: array
 *     description: The order's fulfillments.
 *     items:
 *       $ref: '#/components/schemas/VendorOrderFulfillment'
 *   shipping_address:
 *     $ref: '#/components/schemas/VendorOrderAddress'
 *   billing_address:
 *     $ref: '#/components/schemas/VendorOrderAddress'
 *   id:
 *     type: string
 *     title: id
 *     description: The order's ID.
 *   version:
 *     type: number
 *     title: version
 *     description: The order's version.
 *   region_id:
 *     type: string
 *     title: region_id
 *     description: The ID of the region associated with the order.
 *   customer_id:
 *     type: string
 *     title: customer_id
 *     description: The ID of the customer that placed the order.
 *   sales_channel_id:
 *     type: string
 *     title: sales_channel_id
 *     description: The ID of the sales channel the order is placed in.
 *   email:
 *     type: string
 *     title: email
 *     description: The email of the customer that placed the order.
 *     format: email
 *   currency_code:
 *     type: string
 *     title: currency_code
 *     description: The order's currency code.
 *   display_id:
 *     type: number
 *     title: display_id
 *     description: The order's display ID.
 *   items:
 *     type: array
 *     description: The order's items.
 *     items:
 *       $ref: '#/components/schemas/VendorOrderLineItem'
 *   shipping_methods:
 *     type: array
 *     description: The order's shipping methods.
 *     items:
 *       $ref: '#/components/schemas/VendorOrderShippingMethod'
 *   commission_value:
 *     $ref: '#/components/schemas/VendorOrderCommissionValue'
 *   commission_lines:
 *     type: array
 *     description: The commission breakdown.
 *     items:
 *       $ref: '#/components/schemas/VendorOrderCommissionLine'
 *   payment_status:
 *     type: string
 *     description: The order's payment status.
 *     enum:
 *       - canceled
 *       - pending
 *       - not_paid
 *       - awaiting
 *       - authorized
 *       - partially_authorized
 *       - captured
 *       - partially_refunded
 *       - refunded
 *       - requires_action
 *   fulfillment_status:
 *     type: string
 *     description: The order's fulfillment status.
 *     enum:
 *       - canceled
 *       - not_fulfilled
 *       - partially_fulfilled
 *       - fulfilled
 *       - partially_shipped
 *       - shipped
 *       - partially_delivered
 *       - delivered
 *   summary:
 *     $ref: '#/components/schemas/VendorOrderSummary'
 *   metadata:
 *     type: object
 *     description: The order's metadata, can hold custom key-value pairs.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the order was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the order was updated.
 *   original_item_total:
 *     type: number
 *     title: original_item_total
 *     description: The total of the order's items including taxes, excluding promotions.
 *   original_item_subtotal:
 *     type: number
 *     title: original_item_subtotal
 *     description: The total of the order's items excluding taxes, including promotions.
 *   original_item_tax_total:
 *     type: number
 *     title: original_item_tax_total
 *     description: The tax total of the order's items excluding promotions.
 *   item_total:
 *     type: number
 *     title: item_total
 *     description: The total of the order's items including taxes and promotions.
 *   item_subtotal:
 *     type: number
 *     title: item_subtotal
 *     description: The total of the order's items excluding taxes, including promotions.
 *   item_tax_total:
 *     type: number
 *     title: item_tax_total
 *     description: The tax total of the order's items including promotions.
 *   original_total:
 *     type: number
 *     title: original_total
 *     description: The order's total excluding promotions, including taxes.
 *   original_subtotal:
 *     type: number
 *     title: original_subtotal
 *     description: The order's total excluding taxes, including promotions.
 *   original_tax_total:
 *     type: number
 *     title: original_tax_total
 *     description: The order's tax total, excluding promotions.
 *   total:
 *     type: number
 *     title: total
 *     description: The order's total including taxes and promotions.
 *   subtotal:
 *     type: number
 *     title: subtotal
 *     description: The order's total excluding taxes, including promotions.
 *   tax_total:
 *     type: number
 *     title: tax_total
 *     description: The order's tax total including promotions.
 *   discount_total:
 *     type: number
 *     title: discount_total
 *     description: The order's discount or promotions total.
 *   discount_tax_total:
 *     type: number
 *     title: discount_tax_total
 *     description: The tax total of order's discount or promotion.
 *   gift_card_total:
 *     type: number
 *     title: gift_card_total
 *     description: The order's gift card total.
 *   gift_card_tax_total:
 *     type: number
 *     title: gift_card_tax_total
 *     description: The tax total of the order's gift card.
 *   shipping_total:
 *     type: number
 *     title: shipping_total
 *     description: The order's shipping total including taxes and promotions.
 *   shipping_subtotal:
 *     type: number
 *     title: shipping_subtotal
 *     description: The order's shipping total excluding taxes, including promotions.
 *   shipping_tax_total:
 *     type: number
 *     title: shipping_tax_total
 *     description: The tax total of the order's shipping.
 *   original_shipping_total:
 *     type: number
 *     title: original_shipping_total
 *     description: The order's shipping total including taxes, excluding promotions.
 *   original_shipping_subtotal:
 *     type: number
 *     title: original_shipping_subtotal
 *     description: The order's shipping total excluding taxes, including promotions.
 *   original_shipping_tax_total:
 *     type: number
 *     title: original_shipping_tax_total
 *     description: The tax total of the order's shipping excluding promotions.
 */

/**
 * @schema VendorOrderAddress
 * title: "VendorOrderAddress"
 * type: object
 * description: An order address.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The address's ID.
 *   customer_id:
 *     type: string
 *     title: customer_id
 *     description: The ID of the customer this address belongs to.
 *   first_name:
 *     type: string
 *     title: first_name
 *     description: The address's first name.
 *   last_name:
 *     type: string
 *     title: last_name
 *     description: The address's last name.
 *   phone:
 *     type: string
 *     title: phone
 *     description: The address's phone.
 *   company:
 *     type: string
 *     title: company
 *     description: The address's company.
 *   address_1:
 *     type: string
 *     title: address_1
 *     description: The address's first line.
 *   address_2:
 *     type: string
 *     title: address_2
 *     description: The address's second line.
 *   city:
 *     type: string
 *     title: city
 *     description: The address's city.
 *   country_code:
 *     type: string
 *     title: country_code
 *     description: The address's country code.
 *     example: us
 *   country:
 *     $ref: '#/components/schemas/VendorOrderCountryCode'
 *   province:
 *     type: string
 *     title: province
 *     description: The address's province.
 *   postal_code:
 *     type: string
 *     title: postal_code
 *     description: The address's postal code.
 *   metadata:
 *     type: object
 *     description: The address's metadata, can hold custom key-value pairs.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the address was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the address was updated.
 */

/**
 * @schema VendorOrderCountryCode
 * title: "VendorOrderCountryCode"
 * type: object
 * description: The country's details.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The country's ID.
 *   iso_2:
 *     type: string
 *     title: iso_2
 *     description: The country's iso 2.
 *     example: us
 *   iso_3:
 *     type: string
 *     title: iso_3
 *     description: The country's iso 3.
 *     example: usa
 *   num_code:
 *     type: string
 *     title: num_code
 *     description: The country's num code.
 *     example: 840
 *   name:
 *     type: string
 *     title: name
 *     description: The country's name.
 *   display_name:
 *     type: string
 *     title: display_name
 *     description: The country's display name.
 */

/**
 * @schema VendorSalesChannel
 * title: "VendorSalesChannel"
 * type: object
 * description: The sales channel's details.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The sales channel's ID.
 *   name:
 *     type: string
 *     title: name
 *     description: The sales channel's name.
 *   description:
 *     type: string
 *     title: description
 *     description: The sales channel's description.
 *   is_disabled:
 *     type: boolean
 *     title: is_disabled
 *     description: Whether the sales channel is disabled.
 *   metadata:
 *     type: object
 *     description: The sales channel's metadata, can hold custom key-value pairs.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the sales channel was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the sales channel was updated.
 */

/**
 * @schema VendorOrderPaymentCollection
 * title: "VendorOrderPaymentCollection"
 * type: object
 * description: The payment collection's details.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The payment collection's ID.
 *   currency_code:
 *     type: string
 *     title: currency_code
 *     description: The payment collection's currency code.
 *   region_id:
 *     type: string
 *     title: region_id
 *     description: The ID of the region this payment collection is associated with.
 *   amount:
 *     type: number
 *     title: amount
 *     description: The total amount to be paid.
 *   authorized_amount:
 *     type: number
 *     title: authorized_amount
 *     description: The total authorized amount of the collection's payments.
 *   captured_amount:
 *     type: number
 *     title: captured_amount
 *     description: The total captured amount of the collection's payments.
 *   refunded_amount:
 *     type: number
 *     title: refunded_amount
 *     description: The total refunded amount of the collection's payments.
 *   completed_at:
 *     type: string
 *     format: date-time
 *     title: completed_at
 *     description: The date the payment collection was completed.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the payment collection was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the payment collection was updated.
 *   metadata:
 *     type: object
 *     description: The payment collection's metadata, can hold custom key-value pairs.
 *   status:
 *     type: string
 *     description: The payment collection's status.
 *     enum:
 *       - canceled
 *       - not_paid
 *       - awaiting
 *       - authorized
 *       - partially_authorized
 */

/**
 * @schema VendorOrderSummary
 * title: "VendorOrderSummary"
 * type: object
 * description: The order's summary details.
 * properties:
 *   total:
 *     type: number
 *     title: total
 *     description: The order's total including taxes and promotions.
 *   subtotal:
 *     type: number
 *     title: subtotal
 *     description: The order's total excluding taxes, including promotions.
 *   total_tax:
 *     type: number
 *     title: total_tax
 *     description: The order's total taxes.
 *   ordered_total:
 *     type: number
 *     title: ordered_total
 *     description: The order's total when it was placed.
 *   fulfilled_total:
 *     type: number
 *     title: fulfilled_total
 *     description: The total of the fulfilled items of the order.
 *   returned_total:
 *     type: number
 *     title: returned_total
 *     description: The total of the order's returned items.
 *   return_request_total:
 *     type: number
 *     title: return_request_total
 *     description: The total of the items requested to be returned.
 *   write_off_total:
 *     type: number
 *     title: write_off_total
 *     description: The total of the items removed from the order.
 *   paid_total:
 *     type: number
 *     title: paid_total
 *     description: The total amount paid.
 *   refunded_total:
 *     type: number
 *     title: refunded_total
 *     description: The total amount refunded.
 */

/**
 * @schema VendorOrderFulfillment
 * title: "VendorOrderFulfillment"
 * type: object
 * description: The fulfillment's details.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The fulfillment's ID.
 *   location_id:
 *     type: string
 *     title: location_id
 *     description: The ID of the location the fulfillment's items are shipped from.
 *   provider_id:
 *     type: string
 *     title: provider_id
 *     description: The ID of the fulfillment provider handling this fulfillment.
 *   shipping_option_id:
 *     type: string
 *     title: shipping_option_id
 *     description: The ID of the shipping option this fulfillment is created for.
 *   provider:
 *     $ref: '#/components/schemas/VendorFulfillmentProvider'
 *   delivery_address:
 *     $ref: '#/components/schemas/VendorFulfillmentAddress'
 *   items:
 *     type: array
 *     description: The fulfillment's items.
 *     items:
 *       $ref: '#/components/schemas/VendorFulfillmentItem'
 *   labels:
 *     type: array
 *     description: The fulfillment's shipment labels.
 *     items:
 *       $ref: '#/components/schemas/VendorFulfillmentLabel'
 *   packed_at:
 *     type: string
 *     title: packed_at
 *     description: The date the fulfillment was packed at.
 *   shipped_at:
 *     type: string
 *     title: shipped_at
 *     description: The date the fulfillment was shipped at.
 *   delivered_at:
 *     type: string
 *     title: delivered_at
 *     description: The date the fulfillment was delivered at.
 *   canceled_at:
 *     type: string
 *     title: canceled_at
 *     description: The date the fulfillment was canceled at.
 *   data:
 *     type: object
 *     description: The fulfillment's data, useful for the third-party provider handling the fulfillment.
 *     externalDocs:
 *       url: https://docs.medusajs.com/v2/resources/commerce-modules/fulfillment/shipping-option#data-property
 *   metadata:
 *     type: object
 *     description: The fulfillment's metadata, can hold custom key-value pairs.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the fulfillment was created at.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the fulfillment was updated at.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the fulfillment was deleted at.
 */

/**
 * @schema VendorFulfillmentItem
 * title: "VendorFulfillmentItem"
 * type: object
 * description: The details of a fulfillment's item.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The item's ID.
 *   title:
 *     type: string
 *     title: title
 *     description: The item's title.
 *   quantity:
 *     type: number
 *     title: quantity
 *     description: The item's quantity to be fulfilled.
 *   sku:
 *     type: string
 *     title: sku
 *     description: The item's SKU.
 *   barcode:
 *     type: string
 *     title: barcode
 *     description: The item's barcode.
 *   line_item_id:
 *     type: string
 *     title: line_item_id
 *     description: The ID of the order's line item to be fulfilled.
 *   inventory_item_id:
 *     type: string
 *     title: inventory_item_id
 *     description: The ID of the inventory item of the underlying product variant.
 *   fulfillment_id:
 *     type: string
 *     title: fulfillment_id
 *     description: The ID of the fulfillment the item belongs to.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the item was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the item was updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the item was deleted.
 */

/**
 * @schema VendorFulfillmentLabel
 * title: "VendorFulfillmentLabel"
 * type: object
 * description: The details of a fulfillmet's shipment label.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The label's ID.
 *   tracking_number:
 *     type: string
 *     title: tracking_number
 *     description: The label's tracking number.
 *   tracking_url:
 *     type: string
 *     title: tracking_url
 *     description: The label's tracking URL.
 *   label_url:
 *     type: string
 *     title: label_url
 *     description: The label's URL.
 *   fulfillment_id:
 *     type: string
 *     title: fulfillment_id
 *     description: The ID of the fulfillment the label is associated with.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the label was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the label was updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the label was deleted.
 */

/**
 * @schema VendorFulfillmentProvider
 * title: "VendorFulfillmentProvider"
 * type: object
 * description: The fulfillment provider's details.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The provider's ID.
 *   is_enabled:
 *     type: boolean
 *     title: is_enabled
 *     description: The provider's is enabled.
 */

/**
 * @schema VendorFulfillmentAddress
 * title: "VendorFulfillmentAddress"
 * type: object
 * description: An address's details.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The address's ID.
 *   company:
 *     type: string
 *     title: company
 *     description: The address's company.
 *   first_name:
 *     type: string
 *     title: first_name
 *     description: The address's first name.
 *   last_name:
 *     type: string
 *     title: last_name
 *     description: The address's last name.
 *   address_1:
 *     type: string
 *     title: address_1
 *     description: The address's first line.
 *   address_2:
 *     type: string
 *     title: address_2
 *     description: The address's second line.
 *   city:
 *     type: string
 *     title: city
 *     description: The address's city.
 *   country_code:
 *     type: string
 *     title: country_code
 *     description: The address's country code.
 *   province:
 *     type: string
 *     title: province
 *     description: The address's province.
 *   postal_code:
 *     type: string
 *     title: postal_code
 *     description: The address's postal code.
 *   phone:
 *     type: string
 *     title: phone
 *     description: The address's phone.
 *   metadata:
 *     type: object
 *     description: The address's metadata, can hold custom key-value pairs.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the address was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the address was updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the address was deleted.
 */

/**
 * @schema VendorOrderShippingMethod
 * title: "VendorOrderShippingMethod"
 * type: object
 * description: The shipping method's details.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The shipping method's ID.
 *   name:
 *     type: string
 *     title: name
 *     description: The shipping method's name.
 *   description:
 *     type: string
 *     title: description
 *     description: The shipping method's description.
 *   amount:
 *     type: number
 *     title: amount
 *     description: The shipping method's amount.
 *   is_tax_inclusive:
 *     type: boolean
 *     title: is_tax_inclusive
 *     description: Whether the shipping method's amount includes applied taxes.
 *   shipping_option_id:
 *     type: string
 *     title: shipping_option_id
 *     description: The ID of the shipping option this method was created from.
 *   data:
 *     type: object
 *     description: The shipping method's data, useful for fulfillment provider handling its fulfillment.
 *     externalDocs:
 *       url: https://docs.medusajs.com/v2/resources/commerce-modules/fulfillment/shipping-option#data-property
 *   metadata:
 *     type: object
 *     description: The shipping method's metadata, can hold custom key-value pairs.
 *   original_total:
 *     type: number
 *     title: original_total
 *     description: The shipping method's total including taxes, excluding promotions.
 *   original_subtotal:
 *     type: number
 *     title: original_subtotal
 *     description: The shipping method's total excluding taxes, including promotions.
 *   original_tax_total:
 *     type: number
 *     title: original_tax_total
 *     description: The shipping method's total taxes excluding promotions.
 *   total:
 *     type: number
 *     title: total
 *     description: The shipping method's total including taxes and promotions.
 *   subtotal:
 *     type: number
 *     title: subtotal
 *     description: The shipping method's total excluding taxes, including promotions.
 *   tax_total:
 *     type: number
 *     title: tax_total
 *     description: The shipping method's tax total including promotions.
 *   discount_total:
 *     type: number
 *     title: discount_total
 *     description: The total discounts applied on the shipping method.
 *   discount_tax_total:
 *     type: number
 *     title: discount_tax_total
 *     description: The taxes applied on the discount amount.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the shipping method was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the shipping method was updated.
 */

/**
 * @schema VendorOrderLineItem
 * title: "VendorOrderLineItem"
 * type: object
 * description: The item's details.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The item's ID.
 *   title:
 *     type: string
 *     title: title
 *     description: The item's title.
 *   subtitle:
 *     type: string
 *     title: subtitle
 *     description: The item's subtitle.
 *   thumbnail:
 *     type: string
 *     title: thumbnail
 *     description: The URL of the item's thumbnail.
 *   variant:
 *     $ref: '#/components/schemas/VendorProductVariant'
 *   variant_id:
 *     type: string
 *     title: variant_id
 *     description: The ID of the associated variant.
 *   product:
 *     $ref: '#/components/schemas/VendorProduct'
 *   product_id:
 *     type: string
 *     title: product_id
 *     description: The ID of the associated product.
 *   product_title:
 *     type: string
 *     title: product_title
 *     description: The item's product title.
 *   product_description:
 *     type: string
 *     title: product_description
 *     description: The item's product description.
 *   product_subtitle:
 *     type: string
 *     title: product_subtitle
 *     description: The item's product subtitle.
 *   product_type:
 *     type: string
 *     title: product_type
 *     description: The item's product type.
 *   product_collection:
 *     type: string
 *     title: product_collection
 *     description: The ID of the collection the item's product belongs to.
 *   product_handle:
 *     type: string
 *     title: product_handle
 *     description: The item's product handle.
 *   variant_sku:
 *     type: string
 *     title: variant_sku
 *     description: The item's variant SKU.
 *   variant_barcode:
 *     type: string
 *     title: variant_barcode
 *     description: The item's variant barcode.
 *   variant_title:
 *     type: string
 *     title: variant_title
 *     description: The item's variant title.
 *   variant_option_values:
 *     type: object
 *     description: The values of the item variant's options.
 *     example:
 *       Color: Blue
 *   requires_shipping:
 *     type: boolean
 *     title: requires_shipping
 *     description: Whether the item requires shipping.
 *   is_discountable:
 *     type: boolean
 *     title: is_discountable
 *     description: Whether the item is discountable.
 *   is_tax_inclusive:
 *     type: boolean
 *     title: is_tax_inclusive
 *     description: Whether the item is tax inclusive.
 *   compare_at_unit_price:
 *     type: number
 *     title: compare_at_unit_price
 *     description: The original price of the item before a promotion or sale.
 *   unit_price:
 *     type: number
 *     title: unit_price
 *     description: The item's unit price.
 *   quantity:
 *     type: number
 *     title: quantity
 *     description: The item's quantity.
 *   detail:
 *     type: object
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the item was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the item was updated.
 *   metadata:
 *     type: object
 *     description: The item's metadata, can hold custom key-value pairs.
 *   original_total:
 *     type: number
 *     title: original_total
 *     description: The item's total including taxes, excluding promotions.
 *   original_subtotal:
 *     type: number
 *     title: original_subtotal
 *     description: The item's total excluding taxes, including promotions.
 *   original_tax_total:
 *     type: number
 *     title: original_tax_total
 *     description: The total taxes of the item, excluding promotions.
 *   item_total:
 *     type: number
 *     title: item_total
 *     description: The total taxes of the item, including promotions.
 *   item_subtotal:
 *     type: number
 *     title: item_subtotal
 *     description: The item's total excluding taxes, including promotions.
 *   item_tax_total:
 *     type: number
 *     title: item_tax_total
 *     description: The total taxes of the item, including promotions.
 *   total:
 *     type: number
 *     title: total
 *     description: The item's total, including taxes and promotions.
 *   subtotal:
 *     type: number
 *     title: subtotal
 *     description: The item's subtotal excluding taxes, including promotions.
 *   tax_total:
 *     type: number
 *     title: tax_total
 *     description: The tax total of the item including promotions.
 *   discount_total:
 *     type: number
 *     title: discount_total
 *     description: The total discount amount of the item.
 *   discount_tax_total:
 *     type: number
 *     title: discount_tax_total
 *     description: The total taxes applied on the discounted amount.
 *   refundable_total:
 *     type: number
 *     title: refundable_total
 *     description: The total refundable amount of the item's total.
 *   refundable_total_per_unit:
 *     type: number
 *     title: refundable_total_per_unit
 *     description: The total refundable amount of the item's total for a single quantity.
 *   product_type_id:
 *     type: string
 *     title: product_type_id
 *     description: The ID of the associated product's type.
 */

/**
 * @schema VendorProductVariant
 * title: "VendorProductVariant"
 * type: object
 * description: The product variant's details.
 * properties:
 *   prices:
 *     type: array
 *     description: The variant's prices.
 *     items:
 *       type: object
 *   id:
 *     type: string
 *     title: id
 *     description: The variant's ID.
 *   title:
 *     type: string
 *     title: title
 *     description: The variant's title.
 *   sku:
 *     type: string
 *     title: sku
 *     description: The variant's SKU.
 *   barcode:
 *     type: string
 *     title: barcode
 *     description: The variant's barcode.
 *   ean:
 *     type: string
 *     title: ean
 *     description: The variant's EAN code.
 *   upc:
 *     type: string
 *     title: upc
 *     description: The variant's UPC.
 *   allow_backorder:
 *     type: boolean
 *     title: allow_backorder
 *     description: Whether the variant can be ordered even if it's out of stock.
 *   manage_inventory:
 *     type: boolean
 *     title: manage_inventory
 *     description: Whether the Medusa application manages the variant's inventory quantity and availablility. If disabled, the variant is always considered in stock.
 *   inventory_quantity:
 *     type: number
 *     title: inventory_quantity
 *     description: The variant's inventory quantity. This is only included if you pass in the `fields` query parameter a `+variants.inventory_quantity` parameter.
 *   hs_code:
 *     type: string
 *     title: hs_code
 *     description: The variant's HS code.
 *   origin_country:
 *     type: string
 *     title: origin_country
 *     description: The variant's origin country.
 *   mid_code:
 *     type: string
 *     title: mid_code
 *     description: The variant's MID code.
 *   material:
 *     type: string
 *     title: material
 *     description: The variant's material.
 *   weight:
 *     type: number
 *     title: weight
 *     description: The variant's weight.
 *   length:
 *     type: number
 *     title: length
 *     description: The variant's length.
 *   height:
 *     type: number
 *     title: height
 *     description: The variant's height.
 *   width:
 *     type: number
 *     title: width
 *     description: The variant's width.
 *   variant_rank:
 *     type: number
 *     title: variant_rank
 *     description: The variant's rank among its sibling variants.
 *   options:
 *     type: array
 *     description: The variant's option values.
 *     items:
 *       type: object
 *   product:
 *     type: object
 *   product_id:
 *     type: string
 *     title: product_id
 *     description: The ID of the product that the variant belongs to.
 *   calculated_price:
 *     type: object
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the variant was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the variant was updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the variant was deleted.
 *   metadata:
 *     type: object
 *     description: The variant's metadata, can hold custom key-value pairs.
 */

/**
 * @schema VendorProduct
 * title: "VendorProduct"
 * type: object
 * description: The product's details.
 * properties:
 *   length:
 *     type: number
 *     title: length
 *     description: The product's length.
 *   title:
 *     type: string
 *     title: title
 *     description: The product's title.
 *   status:
 *     type: string
 *     description: The product's status.
 *     enum:
 *       - draft
 *       - proposed
 *       - published
 *       - rejected
 *   description:
 *     type: string
 *     title: description
 *     description: The product's description.
 *   id:
 *     type: string
 *     title: id
 *     description: The product's ID.
 *   metadata:
 *     type: object
 *     description: The product's metadata, can hold custom key-value pairs.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the product was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the product was updated.
 *   handle:
 *     type: string
 *     title: handle
 *     description: The product's unique handle.
 *   subtitle:
 *     type: string
 *     title: subtitle
 *     description: The product's subtitle.
 *   is_giftcard:
 *     type: boolean
 *     title: is_giftcard
 *     description: Whether the product is a gift card.
 *   thumbnail:
 *     type: string
 *     title: thumbnail
 *     description: The product's thumbnail.
 *   width:
 *     type: number
 *     title: width
 *     description: The product's width.
 *   weight:
 *     type: number
 *     title: weight
 *     description: The product's weight.
 *   height:
 *     type: number
 *     title: height
 *     description: The product's height.
 *   origin_country:
 *     type: string
 *     title: origin_country
 *     description: The product's origin country.
 *   hs_code:
 *     type: string
 *     title: hs_code
 *     description: The product's HS code.
 *   mid_code:
 *     type: string
 *     title: mid_code
 *     description: The product's MID code.
 *   material:
 *     type: string
 *     title: material
 *     description: The product's material.
 *   collection_id:
 *     type: string
 *     title: collection_id
 *     description: The ID of the collection that the product belongs to.
 *   type_id:
 *     type: string
 *     title: type_id
 *     description: The ID of the product's type.
 *   images:
 *     type: array
 *     description: The product's images.
 *     items:
 *       $ref: '#/components/schemas/VendorProductImage'
 *   discountable:
 *     type: boolean
 *     title: discountable
 *     description: Whether discounts can be applied on the product.
 *   external_id:
 *     type: string
 *     title: external_id
 *     description: The ID of a product in an external system, such as an ERP or CMS.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the product was deleted.
 */

/**
 * @schema VendorProductImage
 * title: "ProductImage"
 * type: object
 * description: The image's details.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The image's ID.
 *   url:
 *     type: string
 *     title: url
 *     description: The image's URL.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the image was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the image was updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the image was deleted.
 */

/**
 * @schema VendorCustomerOrderOverview
 * type: object
 * description: The order's overview.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The order's ID.
 *   version:
 *     type: number
 *     title: version
 *     description: The order's version.
 *   region_id:
 *     type: string
 *     title: region_id
 *     description: The ID of the region associated with the order.
 *   status:
 *     type: string
 *     title: status
 *     description: The status of the order.
 *   customer_id:
 *     type: string
 *     title: customer_id
 *     description: The ID of the customer that placed the order.
 *   sales_channel_id:
 *     type: string
 *     title: sales_channel_id
 *     description: The ID of the sales channel the order is placed in.
 *   email:
 *     type: string
 *     title: email
 *     description: The email of the customer that placed the order.
 *     format: email
 *   currency_code:
 *     type: string
 *     title: currency_code
 *     description: The order's currency code.
 *   display_id:
 *     type: number
 *     title: display_id
 *     description: The order's display ID.
 *   is_draft_order:
 *     type: boolean
 *     title: is_draft_order
 *     description: Indicates if order is draft.
 *   metadata:
 *     type: object
 *     description: The order's metadata, can hold custom key-value pairs.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the order was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the order was updated.
 */

/**
 * @schema VendorOrderChange
 * type: object
 * description: The order's change.
 * x-schemaName: VendorOrderChange
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The order change's ID.
 *   version:
 *     type: number
 *     title: version
 *     description: >-
 *       The order change's version. This will be the order's version when the
 *       change is applied.
 *   change_type:
 *     type: string
 *     description: The order change's type.
 *     enum:
 *       - return
 *       - exchange
 *       - claim
 *       - edit
 *   order_id:
 *     type: string
 *     title: order_id
 *     description: The ID of the order this change applies on.
 *   return_id:
 *     type: string
 *     title: return_id
 *     description: The ID of the associated return.
 *   exchange_id:
 *     type: string
 *     title: exchange_id
 *     description: The ID of the associated exchange.
 *   claim_id:
 *     type: string
 *     title: claim_id
 *     description: The ID of the associated claim.
 *   actions:
 *     type: array
 *     description: The order change's actions.
 *     items:
 *       $ref: '#/components/schemas/VendorOrderChangeAction'
 *   status:
 *     type: string
 *     description: The order change's status.
 *     enum:
 *       - canceled
 *       - requested
 *       - pending
 *       - confirmed
 *       - declined
 *   requested_by:
 *     type: string
 *     title: requested_by
 *     description: The ID of the user that requested the change.
 *   requested_at:
 *     type: string
 *     title: requested_at
 *     description: The date the order change was requested.
 *     format: date-time
 *   confirmed_by:
 *     type: string
 *     title: confirmed_by
 *     description: The ID of the user that confirmed the order change.
 *   confirmed_at:
 *     type: string
 *     title: confirmed_at
 *     description: The date the order change was confirmed.
 *     format: date-time
 *   declined_by:
 *     type: string
 *     title: declined_by
 *     description: The ID of the user that declined the order change.
 *   declined_reason:
 *     type: string
 *     title: declined_reason
 *     description: The reason the order change was declined.
 *   metadata:
 *     type: object
 *     description: The order change's metadata, can hold custom key-value pairs.
 *   declined_at:
 *     type: string
 *     title: declined_at
 *     description: The date the order change was declined.
 *     format: date-time
 *   canceled_by:
 *     type: string
 *     title: canceled_by
 *     description: The ID of the user that canceled the order change.
 *   canceled_at:
 *     type: string
 *     title: canceled_at
 *     description: The date the order change was canceled.
 *     format: date-time
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the order change was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the order change was updated.
 */

/**
 * @schema VendorOrderChangeAction
 * type: object
 * description: The order change action's details.
 * x-schemaName: VendorOrderChangeAction
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The action's ID.
 *   order_change_id:
 *     type: string
 *     title: order_change_id
 *     description: The ID of the order change that the action belongs to.
 *   order_id:
 *     type: string
 *     title: order_id
 *     description: The ID of the order the associated change is for.
 *   return_id:
 *     type: string
 *     title: return_id
 *     description: The ID of the associated return.
 *   claim_id:
 *     type: string
 *     title: claim_id
 *     description: The ID of the associated claim.
 *   exchange_id:
 *     type: string
 *     title: exchange_id
 *     description: The ID of the associated exchange.
 *   reference:
 *     type: string
 *     title: reference
 *     description: The name of the table this action applies on.
 *     enum:
 *       - claim
 *       - exchange
 *       - return
 *       - order_shipping_method
 *   reference_id:
 *     type: string
 *     title: reference_id
 *     description: The ID of the record in the referenced table.
 *   action:
 *     type: string
 *     description: The applied action.
 *     enum:
 *       - CANCEL_RETURN_ITEM
 *       - FULFILL_ITEM
 *       - DELIVER_ITEM
 *       - CANCEL_ITEM_FULFILLMENT
 *       - ITEM_ADD
 *       - ITEM_REMOVE
 *       - ITEM_UPDATE
 *       - RECEIVE_DAMAGED_RETURN_ITEM
 *       - RECEIVE_RETURN_ITEM
 *       - RETURN_ITEM
 *       - SHIPPING_ADD
 *       - SHIPPING_REMOVE
 *       - SHIP_ITEM
 *       - WRITE_OFF_ITEM
 *       - REINSTATE_ITEM
 *   details:
 *     type: object
 *     description: The action's details.
 *   internal_note:
 *     type: string
 *     title: internal_note
 *     description: A note that's viewed only by admin users.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the action was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the action was updated.
 */
