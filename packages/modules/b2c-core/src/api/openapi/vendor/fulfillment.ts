/**
 * @schema VendorServiceZone
 * type: object
 * description: The shipping option's service zone.
 * x-schemaName: VendorServiceZone
 * required:
 *   - id
 *   - name
 *   - fulfillment_set_id
 *   - fulfillment_set
 *   - geo_zones
 *   - shipping_options
 *   - created_at
 *   - updated_at
 *   - deleted_at
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The service zone's ID.
 *   name:
 *     type: string
 *     title: name
 *     description: The service zone's name.
 *   geo_zones:
 *     type: array
 *     description: The service zone's geo zones.
 *     items:
 *       $ref: "#/components/schemas/VendorGeoZone"
 *   shipping_options:
 *     type: array
 *     description: The service zone's shipping options.
 *     items:
 *       $ref: "#/components/schemas/VendorShippingOption"
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The service zone's created at.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The service zone's updated at.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The service zone's deleted at.
 *
 */

/**
 * @schema VendorFulfillmentSet
 * type: object
 * description: The service zone's fulfillment set.
 * x-schemaName: VendorFulfillmentSet
 * required:
 *   - id
 *   - name
 *   - type
 *   - location
 *   - service_zones
 *   - created_at
 *   - updated_at
 *   - deleted_at
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The fulfillment set's ID.
 *   name:
 *     type: string
 *     title: name
 *     description: The fulfillment set's name.
 *   type:
 *     type: string
 *     title: type
 *     description: The fulfillment set's type.
 *   location:
 *     $ref: "#/components/schemas/VendorStockLocation"
 *   service_zones:
 *     type: array
 *     description: The fulfillment set's service zones.
 *     items:
 *       $ref: "#/components/schemas/VendorServiceZone"
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The fulfillment set's created at.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The fulfillment set's updated at.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The fulfillment set's deleted at.
 *
 */

/**
 * @schema VendorStockLocation
 * type: object
 * description: The stock location's details.
 * x-schemaName: VendorStockLocation
 * required:
 *   - id
 *   - name
 *   - address_id
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The location's ID.
 *   name:
 *     type: string
 *     title: name
 *     description: The location's name.
 *   fulfillment_sets:
 *     type: array
 *     description: The fulfillment sets associated with the location.
 *     items:
 *       $ref: "#/components/schemas/VendorFulfillmentSet"
 *
 */

/**
 * @schema VendorServiceZone
 * type: object
 * description: The shipping option's service zone.
 * x-schemaName: VendorServiceZone
 * required:
 *   - id
 *   - name
 *   - fulfillment_set_id
 *   - fulfillment_set
 *   - geo_zones
 *   - shipping_options
 *   - created_at
 *   - updated_at
 *   - deleted_at
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The service zone's ID.
 *   name:
 *     type: string
 *     title: name
 *     description: The service zone's name.
 *   fulfillment_set_id:
 *     type: string
 *     title: fulfillment_set_id
 *     description: The service zone's fulfillment set id.
 *   fulfillment_set:
 *     $ref: "#/components/schemas/VendorFulfillmentSet"
 *   geo_zones:
 *     type: array
 *     description: The service zone's geo zones.
 *     items:
 *       $ref: "#/components/schemas/VendorGeoZone"
 *   shipping_options:
 *     type: array
 *     description: The service zone's shipping options.
 *     items:
 *       $ref: "#/components/schemas/VendorShippingOption"
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The service zone's created at.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The service zone's updated at.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The service zone's deleted at.
 *
 */
/**
 * @schema VendorGeoZone
 * type: object
 * description: The geo zone's geo zones.
 * x-schemaName: VendorGeoZone
 * required:
 *   - id
 *   - type
 *   - country_code
 *   - province_code
 *   - city
 *   - postal_expression
 *   - created_at
 *   - updated_at
 *   - deleted_at
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The geo zone's ID.
 *   type:
 *     type: string
 *     description: The geo zone's type.
 *     enum:
 *       - country
 *       - province
 *       - city
 *       - zip
 *   country_code:
 *     type: string
 *     title: country_code
 *     description: The geo zone's country code.
 *   province_code:
 *     type: string
 *     title: province_code
 *     description: The geo zone's province code.
 *   city:
 *     type: string
 *     title: city
 *     description: The geo zone's city.
 *   postal_expression:
 *     type: object
 *     description: The geo zone's postal expression.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The geo zone's created at.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The geo zone's updated at.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The geo zone's deleted at.
 *
 */

/**
 * @schema VendorShippingOption
 * type: object
 * description: The shipping option's details.
 * x-schemaName: VendorShippingOption
 * required:
 *   - id
 *   - name
 *   - price_type
 *   - service_zone_id
 *   - service_zone
 *   - shipping_option_type_id
 *   - type
 *   - rules
 *   - prices
 *   - data
 *   - metadata
 *   - created_at
 *   - updated_at
 *   - deleted_at
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The shipping option's ID.
 *   name:
 *     type: string
 *     title: name
 *     description: The shipping option's name.
 *   price_type:
 *     type: string
 *     description: The shipping option's price type. If it's `flat`, the price is fixed and is set in the `prices` property. If it's `calculated`, the price is calculated on checkout by the associated
 *       fulfillment provider.
 *     enum:
 *       - calculated
 *       - flat
 *   service_zone_id:
 *     type: string
 *     title: service_zone_id
 *     description: The ID of the service zone this option belongs to.
 *   service_zone:
 *     $ref: "#/components/schemas/VendorServiceZone"
 *   shipping_option_type_id:
 *     type: string
 *     title: shipping_option_type_id
 *     description: The ID of the associated shipping option type.
 *   type:
 *     $ref: "#/components/schemas/VendorShippingOptionType"
 *   prices:
 *     type: array
 *     description: The shipping option's prices. If the `price_type` is `calculated`, this array will be empty since the price is calculated by the fulfillment provider during checkout.
 *     items:
 *       $ref: "#/components/schemas/VendorShippingOptionPrice"
 *   data:
 *     type: object
 *     description: The shipping option's data, useful for the fulfillment provider handling fulfillments created from this option.
 *     externalDocs:
 *       url: https://docs.medusajs.com/v2/resources/commerce-modules/fulfillment/shipping-option#data-property
 *   metadata:
 *     type: object
 *     description: The shipping option's metadata, can hold custom key-value pairs.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the shipping option was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the shipping option was updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the shipping option was deleted.
 *
 */

/**
 * @schema VendorShippingOptionType
 * type: object
 * description: The shipping option's details.
 * x-schemaName: VendorShippingOptionType
 * required:
 *   - id
 *   - label
 *   - description
 *   - code
 *   - shipping_option_id
 *   - created_at
 *   - updated_at
 *   - deleted_at
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The shipping option's ID.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the shipping option was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the shipping option was updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the shipping option was deleted.
 *   label:
 *     type: string
 *     title: label
 *     description: The type's label.
 *   description:
 *     type: string
 *     title: description
 *     description: The type's description.
 *   code:
 *     type: string
 *     title: code
 *     description: The type's code.
 *   shipping_option_id:
 *     type: string
 *     title: shipping_option_id
 *     description: The type's shipping option id.
 *
 */

/**
 * @schema VendorShippingOptionPrice
 * type: object
 * description: The details of the shipping option's price.
 * x-schemaName: VendorShippingOptionPrice
 * required:
 *   - price_rules
 *   - rules_count
 *   - id
 *   - title
 *   - currency_code
 *   - amount
 *   - raw_amount
 *   - min_quantity
 *   - max_quantity
 *   - price_set_id
 *   - created_at
 *   - updated_at
 *   - deleted_at
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The price's ID.
 *   title:
 *     type: string
 *     title: title
 *     description: The price's title.
 *   currency_code:
 *     type: string
 *     title: currency_code
 *     description: The price's currency code.
 *     example: usd
 *   amount:
 *     type: number
 *     title: amount
 *     description: The price's amount.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the price was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the price was updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the price was deleted.
 *
 */

/**
 * @schema VendorShippingProfile
 * type: object
 * description: The shipping profile details.
 * x-schemaName: VendorShippingProfile
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The shipping profile's ID.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the shipping profile was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the shipping profile was updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the shipping profile was deleted.
 *   name:
 *     type: string
 *     title: label
 *     description: The shipping profile name.
 *   type:
 *     type: string
 *     title: description
 *     description: The shipping profile type.
 */
