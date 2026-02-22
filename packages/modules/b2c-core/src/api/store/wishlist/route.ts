import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys, isPresent, QueryContext } from "@medusajs/framework/utils";

import customerWishlist from "../../../links/customer-wishlist";
import { createWishlistEntryWorkflow } from "../../../workflows/wishlist/workflows";
import { StoreCreateWishlistType } from "./validators";

/**
 * @oas [post] /store/wishlist
 * operationId: "StoreCreateNewWishlist"
 * summary: "Create new wishlist entry"
 * description: "Creates a new wishlist entry by specifying a reference type and reference ID."
 * x-authenticated: true
 * parameters:
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/StoreCreateWishlist"
 * responses:
 *   "201":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: Id of the wishlsit nad reference id.
 *             created_at:
 *               type: string
 *               format: date-time
 *               description: The date with timezone at which the resource was created.
 *             updated_at:
 *               type: string
 *               format: date-time
 *               description: The date with timezone at which the resource was last updated.
 *             deleted_at:
 *               type: string
 *               format: date-time
 *               description: The date with timezone at which the resource was deleted.
 * tags:
 *   - Store Wishlist
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateWishlistType>,
  res: MedusaResponse
) => {
  const { result } = await createWishlistEntryWorkflow.run({
    container: req.scope,
    input: {
      ...req.validatedBody,
      customer_id: req.auth_context.actor_id,
    },
  });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [wishlist],
  } = await query.graph({
    entity: "wishlist",
    fields: req.queryConfig.fields,
    filters: {
      id: result.id,
    },
  });

  res.status(201).json({ wishlist });
};

/**
 * @oas [get] /store/wishlist
 * operationId: StoreGetMyWishlist
 * summary: "Get wishlist of the current user"
 * description: Retrieve a list of products in the wishlist of the current user. The products can be filtered by fields such as `id`. The products can also be sorted or paginated.
 * x-authenticated: true
 * externalDocs:
 *   url: https://docs.medusajs.com/v2/resources/storefront-development/wishlist
 *   description: "Storefront guide: How to retrieve a wishlist of the current user."
 * parameters:
 *   - name: x-publishable-api-key
 *     in: header
 *     description: Publishable API Key created in the Medusa Admin.
 *     required: true
 *     schema:
 *       type: string
 *       externalDocs:
 *         url: https://docs.medusajs.com/api/store#publishable-api-key
 *   - name: fields
 *     in: query
 *     description: Comma-separated fields that should be included in the returned data. if a field is prefixed with `+` it will be added to the default fields, using `-` will remove it from the default
 *       fields. without prefix it will replace the entire default fields.
 *     required: false
 *     schema:
 *       type: string
 *       title: fields
 *       description: Comma-separated fields that should be included in the returned data. if a field is prefixed with `+` it will be added to the default fields, using `-` will remove it from the default
 *         fields. without prefix it will replace the entire default fields.
 *       externalDocs:
 *         url: "#select-fields-and-relations"
 *   - name: offset
 *     in: query
 *     description: The number of items to skip when retrieving a list.
 *     required: false
 *     schema:
 *       type: number
 *       title: offset
 *       description: The number of items to skip when retrieving a list.
 *       externalDocs:
 *         url: "#pagination"
 *   - name: limit
 *     in: query
 *     description: Limit the number of items returned in the list.
 *     required: false
 *     schema:
 *       type: number
 *       title: limit
 *       description: Limit the number of items returned in the list.
 *       externalDocs:
 *         url: "#pagination"
 *   - name: order
 *     in: query
 *     description: The field to sort the data by. By default, the sort order is ascending. To change the order to descending, prefix the field name with `-`.
 *     required: false
 *     schema:
 *       type: string
 *       title: order
 *       description: The field to sort the data by. By default, the sort order is ascending. To change the order to descending, prefix the field name with `-`.
 *   - name: $and
 *     in: query
 *     description: Join query parameters with an AND condition. Each object's content is the same type as the expected query parameters.
 *     required: false
 *     schema:
 *       type: array
 *       description: Join query parameters with an AND condition. Each object's content is the same type as the expected query parameters.
 *       items:
 *         type: object
 *       title: $and
 *   - name: $or
 *     in: query
 *     description: Join query parameters with an OR condition. Each object's content is the same type as the expected query parameters.
 *     required: false
 *     schema:
 *       type: array
 *       description: Join query parameters with an OR condition. Each object's content is the same type as the expected query parameters.
 *       items:
 *         type: object
 *       title: $or
 *   - name: q
 *     in: query
 *     description: Search term to filter the product's searchable properties.
 *     required: false
 *     schema:
 *       type: string
 *       title: q
 *       description: Search term to filter the product's searchable properties.
 *   - name: id
 *     in: query
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           title: id
 *           description: Filter by a product ID.
 *         - type: array
 *           description: Filter by product IDs.
 *           items:
 *             type: string
 *             title: id
 *             description: A product ID.
 *   - name: title
 *     in: query
 *     description: Filter by product titles.
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           title: title
 *           description: Filter by a title.
 *         - type: array
 *           description: Filter by titles.
 *           items:
 *             type: string
 *             title: title
 *             description: A title.
 *   - name: handle
 *     in: query
 *     description: Filter by product handles.
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           title: handle
 *           description: Filter by a product handle.
 *         - type: array
 *           description: Filter by product handles.
 *           items:
 *             type: string
 *             title: handle
 *             description: A product handle.
 *   - name: is_giftcard
 *     in: query
 *     description: Whether the product is a gift card.
 *     required: false
 *     schema:
 *       type: boolean
 *       title: is_giftcard
 *       description: Whether the product is a gift card.
 *   - name: collection_id
 *     in: query
 *     description: Filter by a collection's ID to retrieve the products in it.
 *     required: false
 *     schema:
 *       description: Filter by a collection's ID to retrieve the products in it.
 *       externalDocs:
 *         url: https://docs.medusajs.com/v2/resources/storefront-development/products/collections/products
 *         description: "Storefront guide: Retrieve a collection's products."
 *       items:
 *         type: string
 *         title: collection_id
 *         description: A collection's ID.
 *   - name: tag_id
 *     in: query
 *     description: Filter by a tag's ID to retrieve the products in it.
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           title: tag_id
 *           description: Filter by a product tag's ID.
 *         - type: array
 *           description: Filter by product tag IDs.
 *           items:
 *             type: string
 *             title: tag_id
 *             description: A product tag ID.
 *   - name: type_id
 *     in: query
 *     description: Filter by a type's ID to retrieve the products in it.
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           title: type_id
 *           description: Filter by a product type's ID.
 *         - type: array
 *           description: Filter by product type IDs.
 *           items:
 *             type: string
 *             title: type_id
 *             description: A product type ID.
 *   - name: created_at
 *     in: query
 *     description: Filter by the product's creation date.
 *     required: false
 *     schema:
 *       type: object
 *       description: Filter by the product's creation date.
 *       properties:
 *         $and:
 *           type: array
 *           description: Join query parameters with an AND condition. Each object's content is the same type as the expected query parameters.
 *           items:
 *             type: object
 *           title: $and
 *         $or:
 *           type: array
 *           description: Join query parameters with an OR condition. Each object's content is the same type as the expected query parameters.
 *           items:
 *             type: object
 *           title: $or
 *         $eq:
 *           oneOf:
 *             - type: string
 *               title: $eq
 *               description: Filter by an exact match.
 *             - type: array
 *               description: Filter by multiple exact matches.
 *               items:
 *                 type: string
 *                 title: $eq
 *                 description: An exact match.
 *         $ne:
 *           type: string
 *           title: $ne
 *           description: Filter by values not equal to this parameter.
 *         $in:
 *           type: array
 *           description: Filter by values in this array.
 *           items:
 *             type: string
 *             title: $in
 *             description: The value to match.
 *         $nin:
 *           type: array
 *           description: Filter by values not in this array.
 *           items:
 *             type: string
 *             title: $nin
 *             description: The value not to match.
 *         $not:
 *           oneOf:
 *             - type: string
 *               title: $not
 *               description: Filter by values not matching this parameter.
 *             - type: object
 *               description: Filter by values not matching the conditions in this parameter.
 *               properties:
 *                 $and:
 *                   type: array
 *                   description: Join query parameters with an AND condition. Each object's content is the same type as the expected query parameters.
 *                   items:
 *                     type: object
 *                   title: $and
 *                 $or:
 *                   type: array
 *                   description: Join query parameters with an OR condition. Each object's content is the same type as the expected query parameters.
 *                   items:
 *                     type: object
 *                   title: $or
 *                 $eq:
 *                   oneOf:
 *                     - type: string
 *                       title: $eq
 *                       description: Filter by an exact match.
 *                     - type: array
 *                       description: Filter by multiple exact matches.
 *                       items:
 *                         type: string
 *                         title: $eq
 *                         description: The value to match.
 *                 $ne:
 *                   type: string
 *                   title: $ne
 *                   description: Filter by values not matching this parameter.
 *                 $in:
 *                   type: array
 *                   description: Filter by values in this array.
 *                   items:
 *                     type: string
 *                     title: $in
 *                     description: The value to match.
 *                 $nin:
 *                   type: array
 *                   description: Filter by values not in this array.
 *                   items:
 *                     type: string
 *                     title: $nin
 *                     description: The value to not match
 *                 $not:
 *                   oneOf:
 *                     - type: string
 *                       title: $not
 *                       description: Filter by values not matching this parameter
 *                     - type: object
 *                       description: Filter by values not matching the conditions in this parameter.
 *                     - type: array
 *                       description: Filter by values not matching the values of this parameter.
 *                       items:
 *                         type: string
 *                         title: $not
 *                         description: The values to not match.
 *                 $gt:
 *                   type: string
 *                   title: $gt
 *                   description: Filter by values greater than this parameter. Useful for numbers and dates only.
 *                 $gte:
 *                   type: string
 *                   title: $gte
 *                   description: Filter by values greater than or equal to this parameter. Useful for numbers and dates only.
 *                 $lt:
 *                   type: string
 *                   title: $lt
 *                   description: Filter by values less than this parameter. Useful for numbers and dates only.
 *                 $lte:
 *                   type: string
 *                   title: $lte
 *                   description: Filter by values less than or equal to this parameter. Useful for numbers and dates only.
 *                 $like:
 *                   type: string
 *                   title: $like
 *                   description: Apply a `like` filter. Useful for strings only.
 *                 $re:
 *                   type: string
 *                   title: $re
 *                   description: Apply a regex filter. Useful for strings only.
 *                 $ilike:
 *                   type: string
 *                   title: $ilike
 *                   description: Apply a case-insensitive `like` filter. Useful for strings only.
 *                 $fulltext:
 *                   type: string
 *                   title: $fulltext
 *                   description: Filter to apply on full-text properties.
 *                 $overlap:
 *                   type: array
 *                   description: Filter arrays that have overlapping values with this parameter.
 *                   items:
 *                     type: string
 *                     title: $overlap
 *                     description: The value to match.
 *                 $contains:
 *                   type: array
 *                   description: Filter arrays that contain some of the values of this parameter.
 *                   items:
 *                     type: string
 *                     title: $contains
 *                     description: The values to match.
 *                 $contained:
 *                   type: array
 *                   description: Filter arrays that contain all values of this parameter.
 *                   items:
 *                     type: string
 *                     title: $contained
 *                     description: The values to match.
 *                 $exists:
 *                   type: boolean
 *                   title: $exists
 *                   description: Filter by whether a value for this parameter exists (not `null`).
 *             - type: array
 *               description: Filter by values not matching those in this parameter.
 *               items:
 *                 type: string
 *                 title: $not
 *                 description: The values to not match.
 *         $gt:
 *           type: string
 *           title: $gt
 *           description: Filter by values greater than this parameter. Useful for numbers and dates only.
 *         $gte:
 *           type: string
 *           title: $gte
 *           description: Filter by values greater than or equal to this parameter. Useful for numbers and dates only.
 *         $lt:
 *           type: string
 *           title: $lt
 *           description: Filter by values less than this parameter. Useful for numbers and dates only.
 *         $lte:
 *           type: string
 *           title: $lte
 *           description: Filter by values less than or equal to this parameter. Useful for numbers and dates only.
 *         $like:
 *           type: string
 *           title: $like
 *           description: Apply a `like` filter. Useful for strings only.
 *         $re:
 *           type: string
 *           title: $re
 *           description: Apply a regex filter. Useful for strings only.
 *         $ilike:
 *           type: string
 *           title: $ilike
 *           description: Apply a case-insensitive `like` filter. Useful for strings only.
 *         $fulltext:
 *           type: string
 *           title: $fulltext
 *           description: Filter to apply on full-text properties.
 *         $overlap:
 *           type: array
 *           description: Filter arrays that have overlapping values with this parameter.
 *           items:
 *             type: string
 *             title: $overlap
 *             description: The values to match.
 *         $contains:
 *           type: array
 *           description: Filter arrays that contain some of the values of this parameter.
 *           items:
 *             type: string
 *             title: $contains
 *             description: The values to match.
 *         $contained:
 *           type: array
 *           description: Filter arrays that contain all values of this parameter.
 *           items:
 *             type: string
 *             title: $contained
 *             description: The values to match.
 *         $exists:
 *           type: boolean
 *           title: $exists
 *           description: Filter by whether a value for this parameter exists (not `null`).
 *   - name: updated_at
 *     in: query
 *     description: Filter by the product's update date.
 *     required: false
 *     schema:
 *       type: object
 *       description: Filter by the product's update date.
 *       properties:
 *         $and:
 *           type: array
 *           description: Join query parameters with an AND condition. Each object's content is the same type as the expected query parameters.
 *           items:
 *             type: object
 *           title: $and
 *         $or:
 *           type: array
 *           description: Join query parameters with an OR condition. Each object's content is the same type as the expected query parameters.
 *           items:
 *             type: object
 *           title: $or
 *         $eq:
 *           oneOf:
 *             - type: string
 *               title: $eq
 *               description: Filter by an exact match.
 *             - type: array
 *               description: Filter by multiple exact matches.
 *               items:
 *                 type: string
 *                 title: $eq
 *                 description: An exact match.
 *         $ne:
 *           type: string
 *           title: $ne
 *           description: Filter by values not equal to this parameter.
 *         $in:
 *           type: array
 *           description: Filter by values in this array.
 *           items:
 *             type: string
 *             title: $in
 *             description: The value to match.
 *         $nin:
 *           type: array
 *           description: Filter by values not in this array.
 *           items:
 *             type: string
 *             title: $nin
 *             description: The value not to match.
 *         $not:
 *           oneOf:
 *             - type: string
 *               title: $not
 *               description: Filter by values not matching this parameter.
 *             - type: object
 *               description: Filter by values not matching the conditions in this parameter.
 *               properties:
 *                 $and:
 *                   type: array
 *                   description: Join query parameters with an AND condition. Each object's content is the same type as the expected query parameters.
 *                   items:
 *                     type: object
 *                   title: $and
 *                 $or:
 *                   type: array
 *                   description: Join query parameters with an OR condition. Each object's content is the same type as the expected query parameters.
 *                   items:
 *                     type: object
 *                   title: $or
 *                 $eq:
 *                   oneOf:
 *                     - type: string
 *                       title: $eq
 *                       description: Filter by an exact match.
 *                     - type: array
 *                       description: Filter by multiple exact matches.
 *                       items:
 *                         type: string
 *                         title: $eq
 *                         description: The value to match.
 *                 $ne:
 *                   type: string
 *                   title: $ne
 *                   description: Filter by values not matching this parameter.
 *                 $in:
 *                   type: array
 *                   description: Filter by values in this array.
 *                   items:
 *                     type: string
 *                     title: $in
 *                     description: The value to match.
 *                 $nin:
 *                   type: array
 *                   description: Filter by values not in this array.
 *                   items:
 *                     type: string
 *                     title: $nin
 *                     description: The value to not match
 *                 $not:
 *                   oneOf:
 *                     - type: string
 *                       title: $not
 *                       description: Filter by values not matching this parameter
 *                     - type: object
 *                       description: Filter by values not matching the conditions in this parameter.
 *                     - type: array
 *                       description: Filter by values not matching the values of this parameter.
 *                       items:
 *                         type: string
 *                         title: $not
 *                         description: The values to not match.
 *                 $gt:
 *                   type: string
 *                   title: $gt
 *                   description: Filter by values greater than this parameter. Useful for numbers and dates only.
 *                 $gte:
 *                   type: string
 *                   title: $gte
 *                   description: Filter by values greater than or equal to this parameter. Useful for numbers and dates only.
 *                 $lt:
 *                   type: string
 *                   title: $lt
 *                   description: Filter by values less than this parameter. Useful for numbers and dates only.
 *                 $lte:
 *                   type: string
 *                   title: $lte
 *                   description: Filter by values less than or equal to this parameter. Useful for numbers and dates only.
 *                 $like:
 *                   type: string
 *                   title: $like
 *                   description: Apply a `like` filter. Useful for strings only.
 *                 $re:
 *                   type: string
 *                   title: $re
 *                   description: Apply a regex filter. Useful for strings only.
 *                 $ilike:
 *                   type: string
 *                   title: $ilike
 *                   description: Apply a case-insensitive `like` filter. Useful for strings only.
 *                 $fulltext:
 *                   type: string
 *                   title: $fulltext
 *                   description: Filter to apply on full-text properties.
 *                 $overlap:
 *                   type: array
 *                   description: Filter arrays that have overlapping values with this parameter.
 *                   items:
 *                     type: string
 *                     title: $overlap
 *                     description: The value to match.
 *                 $contains:
 *                   type: array
 *                   description: Filter arrays that contain some of the values of this parameter.
 *                   items:
 *                     type: string
 *                     title: $contains
 *                     description: The values to match.
 *                 $contained:
 *                   type: array
 *                   description: Filter arrays that contain all values of this parameter.
 *                   items:
 *                     type: string
 *                     title: $contained
 *                     description: The values to match.
 *                 $exists:
 *                   type: boolean
 *                   title: $exists
 *                   description: Filter by whether a value for this parameter exists (not `null`).
 *             - type: array
 *               description: Filter by values not matching those in this parameter.
 *               items:
 *                 type: string
 *                 title: $not
 *                 description: The values to not match.
 *         $gt:
 *           type: string
 *           title: $gt
 *           description: Filter by values greater than this parameter. Useful for numbers and dates only.
 *         $gte:
 *           type: string
 *           title: $gte
 *           description: Filter by values greater than or equal to this parameter. Useful for numbers and dates only.
 *         $lt:
 *           type: string
 *           title: $lt
 *           description: Filter by values less than this parameter. Useful for numbers and dates only.
 *         $lte:
 *           type: string
 *           title: $lte
 *           description: Filter by values less than or equal to this parameter. Useful for numbers and dates only.
 *         $like:
 *           type: string
 *           title: $like
 *           description: Apply a `like` filter. Useful for strings only.
 *         $re:
 *           type: string
 *           title: $re
 *           description: Apply a regex filter. Useful for strings only.
 *         $ilike:
 *           type: string
 *           title: $ilike
 *           description: Apply a case-insensitive `like` filter. Useful for strings only.
 *         $fulltext:
 *           type: string
 *           title: $fulltext
 *           description: Filter to apply on full-text properties.
 *         $overlap:
 *           type: array
 *           description: Filter arrays that have overlapping values with this parameter.
 *           items:
 *             type: string
 *             title: $overlap
 *             description: The values to match.
 *         $contains:
 *           type: array
 *           description: Filter arrays that contain some of the values of this parameter.
 *           items:
 *             type: string
 *             title: $contains
 *             description: The values to match.
 *         $contained:
 *           type: array
 *           description: Filter arrays that contain all values of this parameter.
 *           items:
 *             type: string
 *             title: $contained
 *             description: The values to match.
 *         $exists:
 *           type: boolean
 *           title: $exists
 *           description: Filter by whether a value for this parameter exists (not `null`).
 *   - name: region_id
 *     in: query
 *     description: The ID of the region the products are being viewed from. This is required if you're retrieving product variant prices with taxes.
 *     required: false
 *     schema:
 *       type: string
 *       title: region_id
 *       description: The ID of the region the products are being viewed from. This is required if you're retrieving product variant prices with taxes.
 *       externalDocs:
 *         url: https://docs.medusajs.com/v2/resources/storefront-development/products/price/examples/tax-price
 *         description: "Storefront guide: How to show product variants' prices with taxes."
 *   - name: province
 *     in: query
 *     description: The lower-case ISO 3166-2 province code the products are being viewed from. This is useful to narrow down the tax context when calculating product variant prices with taxes.
 *     required: false
 *     schema:
 *       type: string
 *       title: province
 *       description: The lower-case ISO 3166-2 province code the products are being viewed from. This is useful to narrow down the tax context when calculating product variant prices with taxes.
 *       example: us-ca
 *       externalDocs:
 *         url: https://en.wikipedia.org/wiki/ISO_3166-2
 *         description: Learn more about ISO 3166-2
 *   - name: sales_channel_id
 *     in: query
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           title: sales_channel_id
 *           description: The ID of a sales channel to retrieve products in it.
 *         - type: array
 *           description: The IDs of sales channels to retrieve products in them.
 *           items:
 *             type: string
 *             title: sales_channel_id
 *             description: A sales channel's ID.
 *   - name: category_id
 *     in: query
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           title: category_id
 *           description: The ID of a product category to retrieve products in it.
 *         - type: array
 *           description: The ID of product categories to retrieve products in them.
 *           items:
 *             type: string
 *             title: category_id
 *             description: A product category's ID.
 *   - name: variants
 *     in: query
 *     description: Filter the products' variants.
 *     required: false
 *     schema:
 *       type: object
 *       description: Filter the products' variants.
 *       x-schemaName: StoreProductVariantParams
 *       properties:
 *         options:
 *           type: object
 *           description: Filter by the variants' options.
 *           required:
 *             - value
 *             - option_id
 *           properties:
 *             option_id:
 *               type: string
 *               title: option_id
 *               description: The ID of the option to filter by.
 *             value:
 *               type: string
 *               title: value
 *               description: Filter by a value of the option.
 *   - name: country_code
 *     in: query
 *     description: The product's country code.
 *     required: false
 *     schema:
 *       type: string
 *       title: country_code
 *       description: The product's country code.
 *   - name: cart_id
 *     in: query
 *     description: The product's cart id.
 *     required: false
 *     schema:
 *       type: string
 *       title: cart_id
 *       description: The product's cart id.
 * x-codeSamples:
 *   - lang: JavaScript
 *     label: JS SDK
 *     source: |-
 *       import Medusa from "@medusajs/js-sdk"
 * 
 *       let MEDUSA_BACKEND_URL = "http://localhost:9000"
 * 
 *       if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
 *         MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
 *       }
 * 
 *       export const sdk = new Medusa({
 *         baseUrl: MEDUSA_BACKEND_URL,
 *         debug: process.env.NODE_ENV === "development",
 *         publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
 *       })
 * 
 *       sdk.store.product.list()
 *       .then(({ products, count, offset, limit }) => {
 *         console.log(products)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl '{backend_url}/store/products' \
 *       -H 'x-publishable-api-key: {your_publishable_api_key}'
 * tags:
 *   - Store Wishlist
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           allOf:
 *             - type: object
 *               description: The paginated list of products.
 *               required:
 *                 - limit
 *                 - offset
 *                 - count
 *               properties:
 *                 limit:
 *                   type: number
 *                   title: limit
 *                   description: The maximum number of items returned.
 *                 offset:
 *                   type: number
 *                   title: offset
 *                   description: The number of items skipped before retrieving the returned items.
 *                 count:
 *                   type: number
 *                   title: count
 *                   description: The total number of items.
 *             - type: object
 *               description: The paginated list of products.
 *               required:
 *                 - products
 *               properties:
 *                 products:
 *                   type: array
 *                   description: The list of products.
 *                   items:
 *                     $ref: "#/components/schemas/StoreProduct"
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 * 
*/

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const customerId = req.auth_context.actor_id;

  const { data: [wishlist] } = await query.graph({
    entity: customerWishlist.entryPoint,
    fields: [
      "wishlist.products.id",
    ],
    filters: {
      customer_id: customerId,
    },
  });

  const productIds: string[] = [];
  wishlist.wishlist.products.forEach((product) => {
    productIds.push(product.id);
  });

  let context: object = {};

  if (isPresent(req.pricingContext)) {
    const pricingContext = {...req.pricingContext, customer_id: customerId}
    context = {
        "variants": {
            "calculated_price": QueryContext(pricingContext)
        }
    }
  }

  const { data: products, metadata } = await query.graph({
    entity: 'product',
    fields: req.queryConfig.fields,
    filters: {
      id: productIds,
    },
    pagination: req.queryConfig.pagination,
    context,
  });


  res.json({
    products,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take,
  });
};
