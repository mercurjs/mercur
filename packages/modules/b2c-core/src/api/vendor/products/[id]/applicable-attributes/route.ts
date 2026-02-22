import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import categoryAttribute from "../../../../../links/category-attribute";

/**
 * @oas [get] /vendor/products/{id}/applicable-attributes
 * operationId: "VendorGetProductApplicableAttributes"
 * summary: "Get Product Applicable Attributes"
 * description: "Retrieves the applicable attributes for a specific product, including global attributes and category-specific attributes."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the product
 *     schema:
 *       type: string
 *   - in: query
 *     name: fields
 *     description: The comma-separated fields to include in the response
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             attributes:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorAttribute"
 *               description: Array of applicable attributes for the product
 *   "401":
 *     description: Unauthorized
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Unauthorized"
 *   "403":
 *     description: Forbidden
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Forbidden"
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Product not found"
 * tags:
 *   - Vendor Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: ["categories.id"],
    filters: {
      id: req.params.id,
    },
  });
  const categoryIds = product.categories.map((category) => category.id);

  const { data: attributes } = await query.graph({
    entity: categoryAttribute.entryPoint,
    fields: ["attribute_id"],
  });
  const attributeIds = attributes.map((attribute) => attribute.attribute_id);

  const { data: globalAttributes } = await query.graph({
    entity: "attribute",
    fields: req.queryConfig.fields,
    filters: {
      id: {
        $nin: attributeIds,
      },
    },
  });

  const { data: categoryAttributes } = await query.graph({
    entity: categoryAttribute.entryPoint,
    fields: req.queryConfig.fields.map((field) => `attribute.${field}`),
    filters: {
      product_category_id: categoryIds,
    },
  });

  res.json({
    attributes: [
      ...globalAttributes,
      ...categoryAttributes.map((rel) => rel.attribute),
    ],
  });
};
